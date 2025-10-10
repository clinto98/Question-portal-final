import { useState, useCallback, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";
import toast from "react-hot-toast";
import getCroppedImg from "../../utils/cropImage";
import ReactCrop, { centerCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Loader from "../../components/Loader";
import { FaArrowLeft } from "react-icons/fa";

const initialFormData = {
    course: "",
    subject: "",
    paperName: "",
    questionPaperYear: "",
    questionPaperFile: null,
    solutionPaperFile: null,
    unit: "",
    unitNo: "",
    topic: "",
    questionNumber: "",
    FrequentlyAsked: false,
    questionText: "",
    questionImage: null,
    choices: [{ text: "", image: null }, { text: "", image: null }],
    correctAnswer: -1,
    explanation: "",
    explanationImage: null,
    complexity: "Easy",
    keywords: "",
  };

const getImagePreviewUrl = (image) => {
  if (!image) return null;
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }
  return image;
};

const SectionWrapper = ({ title, children }) => (
  <fieldset className="border border-gray-200 p-6 rounded-lg mb-6">
    <legend className="text-lg font-semibold px-2 text-purple-700">{title}</legend>
    <div className="space-y-4">{children}</div>
  </fieldset>
);

const QuestionPaperDetailsInputs = ({ formData }) => (
    <SectionWrapper title="Question Paper Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Paper Name</label>
                <input type="text" value={formData.paperName} readOnly className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100 cursor-not-allowed" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Course</label>
                <input type="text" value={formData.course} readOnly className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100 cursor-not-allowed" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
                <input type="text" value={formData.subject} readOnly className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100 cursor-not-allowed" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                <input type="text" value={formData.questionPaperYear} readOnly className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100 cursor-not-allowed" />
            </div>
        </div>
        <div className="mt-4 flex gap-4">
            {formData.questionPaperFile?.url && (
                <button type="button" onClick={() => window.open(formData.questionPaperFile.url, "_blank")} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-semibold">
                    View Question Paper
                </button>
            )}
            {formData.solutionPaperFile?.url && (
                <button type="button" onClick={() => window.open(formData.solutionPaperFile.url, "_blank")} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-semibold">
                    View Solution
                </button>
            )}
        </div>
    </SectionWrapper>
);

const ContentInputSection = ({ label, textName, textValue, imageValue, onTextChange, onFileChange, onRemoveImage, children }) => {
  const fileInputId = `${textName}-file-input`;
  return (
    <SectionWrapper title={label}>
      {children}
      <textarea name={textName} placeholder={`${label} content...`} value={textValue} onChange={onTextChange} className="border border-gray-300 px-3 py-2 rounded-md w-full h-28 focus:ring-2 focus:ring-purple-500 transition" />
      <div className="flex items-center gap-4">
        <input id={fileInputId} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        <label htmlFor={fileInputId} className="cursor-pointer bg-purple-50 text-purple-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-purple-100 transition">{`Upload ${label} Diagram`}</label>
        {imageValue && (
          <div className="relative">
            <img src={getImagePreviewUrl(imageValue)} alt={`${label} Preview`} className="rounded-md h-24 w-auto object-contain border p-1" />
            <button type="button" onClick={onRemoveImage} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition" aria-label="Remove image">&times;</button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

const ChoicesSection = ({ choices, correctAnswer, setFormData, handleChoiceChange, handleFileChange, removeChoice, addChoice, onRemoveChoiceImage }) => (
  <SectionWrapper title="Answer Choices">
    <div className="space-y-4">
      {choices.map((choice, index) => {
        const choiceFileInputId = `choice-image-input-${index}`;
        return (
          <div key={index} className="flex items-start gap-4 border p-4 rounded-md bg-gray-50">
            <span className="text-gray-500 font-semibold mt-2.5">{index + 1}.</span>
            <div className="flex-grow space-y-3">
              <input type="text" placeholder={`Choice ${index + 1} text`} value={choice.text} onChange={(e) => handleChoiceChange(index, e.target.value)} className="border border-gray-300 px-3 py-2 rounded-md w-full" />
              <div className="flex items-center gap-4">
                <input id={choiceFileInputId} type="file" accept="image/*" onChange={(e) => handleFileChange(e, "choiceImage", index)} className="hidden" />
                <label htmlFor={choiceFileInputId} className="cursor-pointer bg-gray-100 text-gray-700 font-semibold text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition">Upload Choice diagram</label>
                {choice.image && (
                  <div className="relative">
                    <img src={getImagePreviewUrl(choice.image)} alt={`Choice ${index + 1} Preview`} className="rounded h-16 w-auto object-contain border p-1" />
                    <button type="button" onClick={() => onRemoveChoiceImage(index)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition" aria-label="Remove choice image">&times;</button>
                  </div>
                )}
              </div>
            </div>
            {choices.length > 2 && (<button onClick={() => removeChoice(index)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 self-center text-sm">Remove</button>)}
          </div>
        );
      })}
    </div>
    <div className="mt-6 pt-4 border-t">
      <label htmlFor="correct-answer-select" className="block text-sm font-medium text-gray-700 mb-2">Select Correct Answer</label>
      <select id="correct-answer-select" value={correctAnswer} onChange={(e) => setFormData((prev) => ({ ...prev, correctAnswer: parseInt(e.target.value, 10) }))} className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-1/2 focus:ring-2 focus:ring-purple-500">
        <option value={-1}>None</option>
        {choices.map((_, index) => (<option key={index} value={index}>Option {index + 1}</option>))}
      </select>
    </div>
    <button onClick={addChoice} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-4 font-medium">+ Add Another Choice</button>
  </SectionWrapper>
);

const ImageCropModal = ({ modalState, closeModal, applyCrop, onCropComplete, onImageReady }) => {
  const [crop, setCrop] = useState();
  function onImageLoad(e) {
    if (onImageReady) onImageReady(e.currentTarget);
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop({ unit: "%", width: 90, height: 90 }, width, height);
    setCrop(initialCrop);
  }
  return (
    <Modal isOpen={modalState.open} onRequestClose={closeModal} ariaHideApp={false} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4" overlayClassName="fixed inset-0 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full relative">
        <h2 className="text-2xl font-bold mb-4">Crop Image</h2>
        {modalState.src && (<div style={{ maxHeight: "70vh", overflow: "auto" }}><ReactCrop crop={crop} onChange={(c, percentCrop) => setCrop(percentCrop)} onComplete={(pixelCrop) => onCropComplete(null, pixelCrop)}><img src={modalState.src} onLoad={onImageLoad} alt="Crop me" /></ReactCrop></div>)}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={closeModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-semibold">Cancel</button>
          <button onClick={applyCrop} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-semibold">Apply Crop</button>
        </div>
      </div>
    </Modal>
  );
};

export default function ExpertEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [cropModal, setCropModal] = useState({ open: false, src: null, type: "", index: null });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imgElementForCrop, setImgElementForCrop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`${host}/api/expert/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const q = res.data.data;
        const choicesForForm = q.options && q.options.length > 0 ? q.options.map((opt) => ({ text: opt.text || "", image: opt.image || null })) : initialFormData.choices;
        setFormData({
          _id: q._id,
          course: q.questionPaper?.course?.title || "",
          subject: q.questionPaper?.subject || "",
          paperName: q.questionPaper?.name || "",
          questionPaperYear: q.questionPaper?.questionPaperYear || "",
          questionPaperFile: q.questionPaper?.questionPaperFile || null,
          solutionPaperFile: q.questionPaper?.solutionPaperFile || null,
          unit: q.unit || "",
          unitNo: "", // New field
          topic: q.chapter || "", // Pre-populate from chapter
          questionNumber: q.questionNumber || "",
          FrequentlyAsked: q.FrequentlyAsked || false,
          questionText: q.question?.text || "",
          questionImage: q.question?.image || null,
          choices: choicesForForm,
          correctAnswer: q.options?.findIndex((opt) => opt.isCorrect) ?? -1,
          explanation: q.explanation?.text || "",
          explanationImage: q.explanation?.image || null,
          complexity: q.complexity || "Easy",
          keywords: Array.isArray(q.keywords) ? q.keywords.join(", ") : "",
        });
      } catch (err) {
        console.error("Error loading question data", err);
        toast.error("Failed to load question data.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id]);

  const onCropComplete = useCallback((_, pixelCrop) => setCroppedAreaPixels(pixelCrop), []);
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const handleChoiceChange = useCallback((index, value) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.map((choice, i) => i === index ? { ...choice, text: value } : choice);
      return { ...prev, choices: updatedChoices };
    });
  }, []);

  const addChoice = useCallback(() => setFormData((prev) => ({ ...prev, choices: [...prev.choices, { text: "", image: null }] })), []);
  const removeChoice = useCallback((index) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.filter((_, i) => i !== index);
      let newCorrectAnswer = prev.correctAnswer;
      if (index === prev.correctAnswer) newCorrectAnswer = -1;
      else if (index < prev.correctAnswer) newCorrectAnswer = prev.correctAnswer - 1;
      return { ...prev, choices: updatedChoices, correctAnswer: newCorrectAnswer };
    });
  }, []);

  const handleFileChange = useCallback((e, field, index = null) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropModal({ open: true, src: URL.createObjectURL(file), type: field, index });
    e.target.value = null;
  }, []);

  const closeModal = () => setCropModal({ open: false, src: null, type: "", index: null });

  const applyCrop = useCallback(async () => {
    if (!croppedAreaPixels || !imgElementForCrop) return toast.error("Please make a crop selection.");
    setLoading(true);
    try {
      const scaleX = imgElementForCrop.naturalWidth / imgElementForCrop.width;
      const scaleY = imgElementForCrop.naturalHeight / imgElementForCrop.height;
      const correctedCrop = { x: croppedAreaPixels.x * scaleX, y: croppedAreaPixels.y * scaleY, width: croppedAreaPixels.width * scaleX, height: croppedAreaPixels.height * scaleY };
      const blob = await getCroppedImg(cropModal.src, correctedCrop);
      const croppedFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      if (cropModal.type === "choiceImage") {
        setFormData((prev) => {
          const updatedChoices = prev.choices.map((choice, i) => i === cropModal.index ? { ...choice, image: croppedFile } : choice);
          return { ...prev, choices: updatedChoices };
        });
      } else {
        setFormData((prev) => ({ ...prev, [cropModal.type]: croppedFile }));
      }
      closeModal();
    } catch (error) {
      console.error("Failed to apply crop:", error);
      toast.error("Could not apply crop.");
    } finally {
      setLoading(false);
    }
  }, [cropModal, croppedAreaPixels, imgElementForCrop]);

  const handleRemoveImage = useCallback((fieldName) => setFormData((prev) => ({ ...prev, [fieldName]: null })), []);
  const handleRemoveChoiceImage = useCallback((index) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.map((choice, i) => i === index ? { ...choice, image: null } : choice);
      return { ...prev, choices: updatedChoices };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    // Frontend Validation
    if (!formData.questionText && !formData.questionImage) return toast.error("A question must have either text or an image.");
    if (!formData.explanation && !formData.explanationImage) return toast.error("An explanation must have either text or an image.");
    if (formData.choices.some(c => !c.text && !c.image)) return toast.error("Each answer choice must have either text or an image.");
    if (formData.correctAnswer === -1) return toast.error("Please select a correct answer.");
    if (!formData.unitNo || !formData.topic || !formData.complexity) return toast.error("Please fill in Unit No, Topic, and Complexity.");

    if (!window.confirm("Are you sure you want to finalize this question?")) return;

    setLoading(true);
    const toastId = toast.loading("Finalizing question...");
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (!["choices", "questionImage", "explanationImage"].includes(key) && formData[key] !== null) {
          formPayload.append(key, formData[key]);
        }
      });

      if (formData.questionImage instanceof File) formPayload.append("questionImage", formData.questionImage);
      if (formData.explanationImage instanceof File) formPayload.append("explanationImage", formData.explanationImage);

      if (typeof formData.questionImage === "string") formPayload.append("existingQuestionImage", formData.questionImage);
      if (typeof formData.explanationImage === "string") formPayload.append("existingExplanationImage", formData.explanationImage);

      formData.choices.forEach((choice) => {
        formPayload.append("choicesText[]", choice.text || "");
        if (choice.image instanceof File) {
          formPayload.append("choicesImage", choice.image);
          formPayload.append("hasImage[]", "true");
          formPayload.append("existingChoiceImages[]", "");
        } else if (typeof choice.image === "string") {
          formPayload.append("hasImage[]", "true");
          formPayload.append("existingChoiceImages[]", choice.image);
        }
        else {
          formPayload.append("hasImage[]", "false");
          formPayload.append("existingChoiceImages[]", "");
        }
      });

      const token = localStorage.getItem("token");
      await axios.post(`${host}/api/expert/questions/${id}/approve`, formPayload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      toast.success("Question finalized successfully!", { id: toastId });
      navigate("/expert/dashboard");
    } catch (err) {
      console.error("Error finalizing question:", err);
      const errorMessage = err.response?.data?.message || "Question finalization failed!";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [formData, navigate, id]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto p-6 sm:p-8 bg-white rounded-xl shadow-lg relative">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold"
        >
          <FaArrowLeft />
          Back
        </button>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Finalize Question</h1>
        <p className="text-gray-500 mb-8 border-b pb-4">Review and finalize all details for this question.</p>
        {loading && (<div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-40 rounded-xl"><Loader /></div>)}
        <form onSubmit={(e) => e.preventDefault()}>
          <QuestionPaperDetailsInputs formData={formData} />
          <ContentInputSection label="Question" textName="questionText" textValue={formData.questionText} imageValue={formData.questionImage} onTextChange={handleInputChange} onFileChange={(e) => handleFileChange(e, "questionImage")} onRemoveImage={() => handleRemoveImage("questionImage")}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Question Number</label>
              <input type="text" name="questionNumber" placeholder="e.g., 1a, II.3" value={formData.questionNumber} onChange={handleInputChange} className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-1/2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" />
            </div>
          </ContentInputSection>
          <ChoicesSection choices={formData.choices} correctAnswer={formData.correctAnswer} setFormData={setFormData} handleChoiceChange={handleChoiceChange} handleFileChange={handleFileChange} removeChoice={removeChoice} addChoice={addChoice} onRemoveChoiceImage={handleRemoveChoiceImage} />
          <ContentInputSection label="Explanation" textName="explanation" textValue={formData.explanation} imageValue={formData.explanationImage} onTextChange={handleInputChange} onFileChange={(e) => handleFileChange(e, "explanationImage")} onRemoveImage={() => handleRemoveImage("explanationImage")} />
          <SectionWrapper title="Additional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Unit</label>
                <input type="text" name="unit" placeholder="Enter unit name..." value={formData.unit} onChange={handleInputChange} className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Unit No</label>
                <input type="text" name="unitNo" placeholder="Enter unit number..." value={formData.unitNo} onChange={handleInputChange} className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Topic</label>
                <input type="text" name="topic" placeholder="Enter topic..." value={formData.topic} onChange={handleInputChange} className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Complexity</label>
                <select name="complexity" value={formData.complexity} onChange={handleInputChange} className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-purple-500">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Keywords (comma-separated)</label>
                <input type="text" name="keywords" placeholder="e.g. algebra, equations" value={formData.keywords} onChange={handleInputChange} className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="FrequentlyAsked" checked={formData.FrequentlyAsked} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-sm font-medium text-gray-700">Mark as a frequently asked question</span>
              </label>
            </div>
          </SectionWrapper>
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t">
            <button type="button" onClick={handleSubmit} disabled={loading} className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition font-semibold disabled:bg-purple-300">Save & Finalize</button>
          </div>
        </form>
      </div>
      {cropModal.open && (<ImageCropModal modalState={cropModal} closeModal={closeModal} applyCrop={applyCrop} onCropComplete={onCropComplete} onImageReady={setImgElementForCrop} />)}
    </div>
  );
}