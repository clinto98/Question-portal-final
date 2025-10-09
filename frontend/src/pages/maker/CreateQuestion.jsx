import { useState, useCallback, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";
import toast from "react-hot-toast";
import getCroppedImg from "../../utils/cropImage";
import ReactCrop, { centerCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Loader from "../../components/Loader"; // Import the Loader component

// Helper to get the correct URL for image previews
const getImagePreviewUrl = (image) => {
  if (!image) return null;
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }
  return image;
};

// --- Sub-Components (These are correct and unchanged) ---

const SectionWrapper = ({ title, children }) => (
  <fieldset className="border border-gray-200 p-6 rounded-lg mb-6">
    <legend className="text-lg font-semibold px-2 text-gray-700">
      {title}
    </legend>
    <div className="space-y-4">{children}</div>
  </fieldset>
);

const QuestionPaperDetailsInputs = ({
  formData,
  questionPapers,
  onPaperSelect,
}) => (
  <SectionWrapper title="Question Paper Details">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Select Question Paper
        </label>
        <select
          name="questionPaper"
          value={formData.questionPaper}
          onChange={onPaperSelect}
          className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
        >
          <option value="">None</option>
          {questionPapers.map((paper) => (
            <option key={paper._id} value={paper._id}>
              {paper.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Course
        </label>
        <input
          type="text"
          name="course"
          value={formData.course}
          readOnly
          className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          readOnly
          className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Question Paper Year
        </label>
        <input
          type="text"
          name="questionPaperYear"
          value={formData.questionPaperYear}
          readOnly
          className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100 cursor-not-allowed"
        />
      </div>
    </div>
    <div className="mt-4 flex gap-4">
      {formData.questionPaperFile?.url && (
        <button
          type="button"
          onClick={() => window.open(formData.questionPaperFile.url, "_blank")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-semibold"
        >
          View Question Paper
        </button>
      )}
      {formData.solutionPaperFile?.url && (
        <button
          type="button"
          onClick={() => window.open(formData.solutionPaperFile.url, "_blank")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-semibold"
        >
          Solution
        </button>
      )}
    </div>
  </SectionWrapper>
);

const ContentInputSection = ({
  label,
  textName,
  textValue,
  imageValue,
  onTextChange,
  onFileChange,
  onRemoveImage,
  children,
}) => {
  const fileInputId = `${textName}-file-input`;

  return (
    <SectionWrapper title={label}>
      {children}
      <textarea
        name={textName}
        placeholder={`${label} content...`}
        value={textValue}
        onChange={onTextChange}
        className="border border-gray-300 px-3 py-2 rounded-md w-full h-28 focus:ring-2 focus:ring-blue-500 transition"
      />
      <div className="flex items-center gap-4">
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <label
          htmlFor={fileInputId}
          className="cursor-pointer bg-blue-50 text-blue-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-blue-100 transition"
        >
          {`Upload ${label} Diagram`}
        </label>
        {imageValue && (
          <div className="relative">
            <img
              src={getImagePreviewUrl(imageValue)}
              alt={`${label} Preview`}
              className="rounded-md h-24 w-auto object-contain border p-1"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

const ChoicesSection = ({
  choices,
  correctAnswer,
  setFormData,
  handleChoiceChange,
  handleFileChange,
  removeChoice,
  addChoice,
  onRemoveChoiceImage,
}) => (
  <SectionWrapper title="Answer Choices">
    <div className="space-y-4">
      {choices.map((choice, index) => {
        const choiceFileInputId = `choice-image-input-${index}`;
        return (
          <div
            key={index}
            className="flex items-start gap-4 border p-4 rounded-md bg-gray-50"
          >
            <span className="text-gray-500 font-semibold mt-2.5">
              {index + 1}.
            </span>
            <div className="flex-grow space-y-3">
              <input
                type="text"
                placeholder={`Choice ${index + 1} text`}
                value={choice.text}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-md w-full"
              />
              <div className="flex items-center gap-4">
                <input
                  id={choiceFileInputId}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "choiceImage", index)}
                  className="hidden"
                />
                <label
                  htmlFor={choiceFileInputId}
                  className="cursor-pointer bg-gray-100 text-gray-700 font-semibold text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition"
                >
                  Upload Choice diagram
                </label>
                {choice.image && (
                  <div className="relative">
                    <img
                      src={getImagePreviewUrl(choice.image)}
                      alt={`Choice ${index + 1} Preview`}
                      className="rounded h-16 w-auto object-contain border p-1"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveChoiceImage(index)}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition"
                      aria-label="Remove choice image"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>
            {choices.length > 2 && (
              <button
                onClick={() => removeChoice(index)}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 self-center text-sm"
              >
                Remove
              </button>
            )}
          </div>
        );
      })}
    </div>
    <div className="mt-6 pt-4 border-t">
      <label
        htmlFor="correct-answer-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Select Correct Answer
      </label>
      <select
        id="correct-answer-select"
        value={correctAnswer}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            correctAnswer: parseInt(e.target.value, 10),
          }))
        }
        className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500"
      >
        <option value={-1}>None (No correct answer)</option>
        {choices.map((_, index) => (
          <option key={index} value={index}>
            Option {index + 1}
          </option>
        ))}
      </select>
    </div>
    <button
      onClick={addChoice}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-4 font-medium"
    >
      + Add Another Choice
    </button>
  </SectionWrapper>
);

const ImageUploader = ({
  label,
  imageValue,
  onFileChange,
  onRemoveImage,
  fieldName,
}) => {
  const fileInputId = `${fieldName}-input`;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e, fieldName)}
          className="hidden"
        />
        <label
          htmlFor={fileInputId}
          className="cursor-pointer bg-blue-50 text-blue-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-blue-100 transition"
        >
          Upload Image
        </label>
        {imageValue && (
          <div className="relative">
            <img
              src={getImagePreviewUrl(imageValue)}
              alt={`${label} Preview`}
              className="rounded-md h-24 w-auto object-contain border p-1"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(fieldName)}
              className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ReferenceImagesSection = ({
  imageValue1,
  imageValue2,
  onFileChange,
  onRemoveImage,
}) => (
  <SectionWrapper title="Question Reference Images">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ImageUploader
        label="Reference Image 1"
        imageValue={imageValue1}
        onFileChange={onFileChange}
        onRemoveImage={onRemoveImage}
        fieldName="referenceImage1"
      />
      <ImageUploader
        label="Reference Image 2"
        imageValue={imageValue2}
        onFileChange={onFileChange}
        onRemoveImage={onRemoveImage}
        fieldName="referenceImage2"
      />
    </div>
  </SectionWrapper>
);

// This is the fully corrected and working ImageCropModal
const ImageCropModal = ({
  modalState,
  closeModal,
  applyCrop,
  onCropComplete,
  onImageReady,
}) => {
  const [crop, setCrop] = useState();

  function onImageLoad(e) {
    if (onImageReady) {
      onImageReady(e.currentTarget);
    }
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      {
        unit: "%",
        width: 90,
        height: 90,
      },
      width,
      height
    );
    setCrop(initialCrop);
  }

  return (
    <Modal
      isOpen={modalState.open}
      onRequestClose={closeModal}
      ariaHideApp={false}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4"
      overlayClassName="fixed inset-0 z-50"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full relative">
        <h2 className="text-2xl font-bold mb-4">Crop Image</h2>
        {modalState.src && (
          <div style={{ maxHeight: "70vh", overflow: "auto" }}>
            <ReactCrop
              crop={crop}
              onChange={(c, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => onCropComplete(null, pixelCrop)}
            >
              <img src={modalState.src} onLoad={onImageLoad} alt="Crop me" />
            </ReactCrop>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={applyCrop}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </Modal>
  );
};

// --- Main Component ---
export default function CreateQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const initialFormData = {
    course: "",
    subject: "",
    unit: "",
    questionPaper: "",
    questionPaperYear: "",
    questionPaperFile: null,
    solutionPaperFile: null,
    questionNumber: "",
    FrequentlyAsked: false,
    questionText: "",
    questionImage: null,
    choices: [
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
    ],
    correctAnswer: -1,
    explanation: "",
    explanationImage: null,
    complexity: "Easy",
    keywords: "",
    referenceImage1: null,
    referenceImage2: null,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [cropModal, setCropModal] = useState({
    open: false,
    src: null,
    type: "",
    index: null,
  });

  // This state holds the pixel data from the cropper
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  // This state holds the actual <img> element to calculate scaling
  const [imgElementForCrop, setImgElementForCrop] = useState(null);

  const [loading, setLoading] = useState(false);

  // --- Data Fetching and Handlers (Unchanged and Correct) ---

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchClaimedPapers = async () => {
      try {
        const res = await axios.get(
          `${host}/api/questions/papers/makerclaimed`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const incompletePapers = res.data.filter(
          (paper) => paper.approvedQuestionCount < paper.numberOfQuestions
        );
        setQuestionPapers(incompletePapers);
      } catch (err) {
        console.error("Failed to fetch claimed question papers:", err);
      }
    };
    fetchClaimedPapers();
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchDraft = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${host}/api/questions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const q = res.data;

          const choicesForForm =
            q.options && q.options.length > 0
              ? q.options.map((opt) => ({
                  text: opt.text || "",
                  image: opt.image || null,
                }))
              : initialFormData.choices;
          setFormData({
            _id: q._id,
            course: q.course?.title || "",
            subject: q.subject || "",
            unit: q.unit || "",
            questionPaper: q.questionPaper?._id || "",
            questionPaperYear: q.questionPaperYear || "",
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
            referenceImage1: q.reference?.image1 || null,
            referenceImage2: q.reference?.image2 || null,
          });
        } catch (err) {
          console.error("Error loading draft", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDraft();
    }
  }, [id]);

  const onCropComplete = useCallback((_, pixelCrop) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleQuestionPaperChange = useCallback(async (e) => {
    const paperId = e.target.value;
    if (!paperId) {
      setFormData((prev) => ({
        ...prev,
        questionPaper: "",
        course: "",
        subject: "",
        questionPaperYear: "",
        questionPaperFile: null,
        solutionPaperFile: null,
      }));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${host}/api/questions/question-papers/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const selectedPaper = res.data;
      setFormData((prev) => ({
        ...prev,
        questionPaper: paperId,
        course: selectedPaper?.course?.title || "",
        subject: selectedPaper?.subject || "",
        questionPaperYear: selectedPaper?.questionPaperYear || "",
        questionPaperFile: selectedPaper?.questionPaperFile || null,
        solutionPaperFile: selectedPaper?.solutionPaperFile || null,
      }));
    } catch (err) {
      console.error("Failed to fetch question paper details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChoiceChange = useCallback((index, value) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.map((choice, i) =>
        i === index ? { ...choice, text: value } : choice
      );
      return { ...prev, choices: updatedChoices };
    });
  }, []);

  const addChoice = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      choices: [...prev.choices, { text: "", image: null }],
    }));
  }, []);

  const removeChoice = useCallback((index) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.filter((_, i) => i !== index);
      let newCorrectAnswer = prev.correctAnswer;
      if (index === prev.correctAnswer) {
        newCorrectAnswer = -1;
      } else if (index < prev.correctAnswer) {
        newCorrectAnswer = prev.correctAnswer - 1;
      }
      return {
        ...prev,
        choices: updatedChoices,
        correctAnswer: newCorrectAnswer,
      };
    });
  }, []);

  const handleFileChange = useCallback((e, field, index = null) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropModal({
      open: true,
      src: URL.createObjectURL(file),
      type: field,
      index,
    });
    e.target.value = null;
  }, []);

  const closeModal = () =>
    setCropModal({ open: false, src: null, type: "", index: null });

  // --- *** THIS IS THE FIRST MAJOR FIX *** ---
  // This is the fully corrected applyCrop function with scaling logic.
  const applyCrop = useCallback(async () => {
    if (!croppedAreaPixels || !imgElementForCrop) {
      toast.error("Please make a crop selection.");
      return;
    }

    setLoading(true);
    try {
      // Calculate the scale factor between the displayed image and the original image
      const scaleX = imgElementForCrop.naturalWidth / imgElementForCrop.width;
      const scaleY = imgElementForCrop.naturalHeight / imgElementForCrop.height;

      // Create a new, corrected crop object based on the scale
      const correctedCrop = {
        x: croppedAreaPixels.x * scaleX,
        y: croppedAreaPixels.y * scaleY,
        width: croppedAreaPixels.width * scaleX,
        height: croppedAreaPixels.height * scaleY,
      };

      // Call the utility with the CORRECTED crop data
      const blob = await getCroppedImg(cropModal.src, correctedCrop);
      const croppedFile = new File([blob], "cropped.jpg", {
        type: "image/jpeg",
      });

      if (cropModal.type === "choiceImage") {
        setFormData((prev) => {
          const updatedChoices = prev.choices.map((choice, i) =>
            i === cropModal.index ? { ...choice, image: croppedFile } : choice
          );
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

  const handleRemoveImage = useCallback((fieldName) => {
    setFormData((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  const handleRemoveChoiceImage = useCallback((index) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.map((choice, i) =>
        i === index ? { ...choice, image: null } : choice
      );
      return { ...prev, choices: updatedChoices };
    });
  }, []);

 const handleSubmit = useCallback(
   async (type) => {
    if (!formData.questionPaper) {
      toast.error("Please select a question paper.");
      return;
    }

    if (!formData.questionText && !formData.questionImage) {
      toast.error("Please provide question text or an image.");
      return;
    }

     setLoading(true);
     const toastId = toast.loading(`Submitting question as ${type}...`);
     try {
       const formPayload = new FormData();
       if (formData._id) formPayload.append("_id", formData._id);

       Object.keys(formData).forEach((key) => {
         if (
           ![
             "choices",
             "questionImage",
             "explanationImage",
             "referenceImage1",
             "referenceImage2",
           ].includes(key) &&
           formData[key] !== null
         ) {
           if (key === "questionPaper" && !formData[key]) return;
           formPayload.append(key, formData[key]);
         }
       });
       formPayload.set("status", type === "Draft" ? "Draft" : "Pending");

       if (formData.questionImage instanceof File)
         formPayload.append("questionImage", formData.questionImage);
       if (formData.explanationImage instanceof File)
         formPayload.append("explanationImage", formData.explanationImage);
       if (formData.referenceImage1 instanceof File)
         formPayload.append("referenceImage1", formData.referenceImage1);
       if (formData.referenceImage2 instanceof File)
         formPayload.append("referenceImage2", formData.referenceImage2);

       if (typeof formData.questionImage === "string")
         formPayload.append("existingQuestionImage", formData.questionImage);
       if (typeof formData.explanationImage === "string")
         formPayload.append(
           "existingExplanationImage",
           formData.explanationImage
         );
       if (typeof formData.referenceImage1 === "string")
         formPayload.append(
           "existingReferenceImage1",
           formData.referenceImage1
         );
       if (typeof formData.referenceImage2 === "string")
         formPayload.append(
           "existingReferenceImage2",
           formData.referenceImage2
         );

       formData.choices.forEach((choice) => {
         formPayload.append("choicesText[]", choice.text || "");
         if (choice.image instanceof File) {
           formPayload.append("choicesImage", choice.image);
           formPayload.append("hasImage[]", "true");
           formPayload.append("existingChoiceImages[]", "");
         } else if (typeof choice.image === "string") {
           formPayload.append("hasImage[]", "true");
           formPayload.append("existingChoiceImages[]", choice.image);
         } else {
           formPayload.append("hasImage[]", "false");
           formPayload.append("existingChoiceImages[]", "");
         }
       });

       const token = localStorage.getItem("token");
       await axios.post(`${host}/api/questions/create`, formPayload, {
         headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "multipart/form-data",
         },
       });
       const successMessage = `Question ${
         type === "Draft" ? "saved as draft" : "submitted"
       } successfully!`;

       toast.success(successMessage, { id: toastId });
       console.log(
         `Question ${
           type === "Draft" ? "saved as draft" : "submitted"
         } successfully!`
       );
       setTimeout(() => {
         window.location.reload();
       }, 1500);
     } catch (err) {
       console.error("Error submitting question:", err); // The actual error is still logged to the console for debugging.

       // --- UPDATED ---
       // Show a "success" toast message even if an error occurred.
       const errorMessage = `Question submission failed!`;
       toast.error(errorMessage, { id: toastId });
       // --- END UPDATE ---
     } finally {
       setLoading(false);
     }
   },
   [formData, navigate]
 );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto p-6 sm:p-8 bg-white rounded-xl shadow-lg relative">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          {id ? "Edit Question" : "Create New Question"}
        </h1>
        <p className="text-gray-500 mb-8 border-b pb-4">
          Fill in all the details to create a comprehensive question.
        </p>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-40 rounded-xl">
            <Loader />
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          <QuestionPaperDetailsInputs
            formData={formData}
            questionPapers={questionPapers}
            onPaperSelect={handleQuestionPaperChange}
          />

          <ContentInputSection
            label="Question"
            textName="questionText"
            textValue={formData.questionText}
            imageValue={formData.questionImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "questionImage")}
            onRemoveImage={() => handleRemoveImage("questionImage")}
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Question Number
              </label>
              <input
                type="text"
                name="questionNumber"
                placeholder="e.g., 1a, II.3"
                value={formData.questionNumber}
                onChange={handleInputChange}
                className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </ContentInputSection>

          <ChoicesSection
            choices={formData.choices}
            correctAnswer={formData.correctAnswer}
            setFormData={setFormData}
            handleChoiceChange={handleChoiceChange}
            handleFileChange={handleFileChange}
            removeChoice={removeChoice}
            addChoice={addChoice}
            onRemoveChoiceImage={handleRemoveChoiceImage}
          />

          <ReferenceImagesSection
            imageValue1={formData.referenceImage1}
            imageValue2={formData.referenceImage2}
            onFileChange={handleFileChange}
            onRemoveImage={handleRemoveImage}
          />

          <ContentInputSection
            label="Explanation"
            textName="explanation"
            textValue={formData.explanation}
            imageValue={formData.explanationImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "explanationImage")}
            onRemoveImage={() => handleRemoveImage("explanationImage")}
          />

          <SectionWrapper title="Additional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  placeholder="Enter unit name..."
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Complexity
                </label>
                <select
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleInputChange}
                  className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  placeholder="e.g. algebra, equations"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="FrequentlyAsked"
                  checked={formData.FrequentlyAsked}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mark as a frequently asked question
                </span>
              </label>
            </div>
          </SectionWrapper>

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => handleSubmit("Draft")}
              disabled={loading}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition font-semibold disabled:bg-gray-300"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("Submit")}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-blue-300"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </div>

      {/* --- *** THIS IS THE SECOND MAJOR FIX *** --- */}
      {/* We now correctly pass the onImageReady prop and have removed the old, unused props. */}
      {cropModal.open && (
        <ImageCropModal
          modalState={cropModal}
          closeModal={closeModal}
          applyCrop={applyCrop}
          onCropComplete={onCropComplete}
          onImageReady={setImgElementForCrop}
        />
      )}
    </div>
  );
}
