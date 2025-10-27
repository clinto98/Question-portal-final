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

// Helper to get the correct URL for image previews
const getImagePreviewUrl = (image) => {
  if (!image) return null;
  if (image instanceof File) return URL.createObjectURL(image);
  return image;
};

// --- REDESIGNED UI COMPONENTS ---

const Input = ({ className, ...props }) => (
  <input
    className={`border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
);

const Select = ({ className, children, ...props }) => (
  <select
    className={`border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Textarea = ({ className, ...props }) => (
  <textarea
    className={`border border-gray-300 px-3 py-2 rounded-md w-full h-28 focus:ring-2 focus:ring-blue-500 transition ${className}`}
    {...props}
  />
);

const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
  ...props
}) => {
  const baseStyles =
    "px-6 py-2.5 rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105";

  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    ghost:
      "bg-transparent text-blue-700 font-semibold text-sm hover:bg-blue-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const SectionWrapper = ({ title, children, className }) => (
  <fieldset
    className={`border border-gray-200 p-6 rounded-lg mb-8 bg-white ${className}`}
  >
    <legend className="text-lg font-semibold px-2 text-gray-800">{title}</legend>
    <div className="space-y-6">{children}</div>
  </fieldset>
);

const FormLabel = ({ children, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    {children}
  </label>
);

// --- REDESIGNED SUB-COMPONENTS ---

const QuestionPaperDetailsInputs = ({
  formData,
  questionPapers,
  onPaperSelect,
}) => (
  <SectionWrapper title="1. Select Question Paper">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <FormLabel>Question Paper</FormLabel>
        <Select
          name="questionPaper"
          value={formData.questionPaper}
          onChange={onPaperSelect}
        >
          <option value="">None</option>
          {questionPapers.map((paper) => (
            <option key={paper._id} value={paper._id}>
              {paper.name} ({paper.createdQuestionsCount} / {paper.numberOfQuestions})
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FormLabel>Course</FormLabel>
        <Input type="text" value={formData.course} readOnly disabled />
      </div>
      <div>
        <FormLabel>Subject</FormLabel>
        <Input type="text" value={formData.subject} readOnly disabled />
      </div>
      <div>
        <FormLabel>Question Paper Year</FormLabel>
        <Input type="text" value={formData.questionPaperYear} readOnly disabled />
      </div>
    </div>
    <div className="mt-4 flex gap-4">
      {formData.questionPaperFile?.url && (
        <Button
          variant="primary"
          onClick={() => window.open(formData.questionPaperFile.url, "_blank")}
        >
          View Question Paper
        </Button>
      )}
      {formData.solutionPaperFile?.url && (
        <Button
          variant="primary"
          onClick={() => window.open(formData.solutionPaperFile.url, "_blank")}
        >
          View Solution
        </Button>
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
  className,
}) => {
  const fileInputId = `${textName}-file-input`;

  return (
    <SectionWrapper title={label} className={className}>
      {children}
      <Textarea
        name={textName}
        placeholder={`${label} content...`}
        value={textValue}
        onChange={onTextChange}
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
  <SectionWrapper title="3. Answer Choices" className="bg-gray-50/50">
    <div className="space-y-4">
      {choices.map((choice, index) => {
        const choiceFileInputId = `choice-image-input-${index}`;
        return (
          <div
            key={index}
            className="flex items-start gap-4 border p-4 rounded-md bg-white shadow-sm"
          >
            <span className="text-gray-500 font-semibold mt-2.5">
              {index + 1}.
            </span>
            <div className="flex-grow space-y-3">
              <Input
                type="text"
                placeholder={`Choice ${index + 1} text`}
                value={choice.text}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
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
              <Button
                variant="danger"
                onClick={() => removeChoice(index)}
                className="px-3 py-1 self-center text-sm"
              >
                Remove
              </Button>
            )}
          </div>
        );
      })}
    </div>
    <div className="mt-6 pt-6 border-t">
      <FormLabel htmlFor="correct-answer-select">
        Select Correct Answer
      </FormLabel>
      <Select
        id="correct-answer-select"
        value={correctAnswer}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            correctAnswer: parseInt(e.target.value, 10),
          }))
        }
        className="sm:w-1/2"
      >
        <option value={-1}>None (No correct answer)</option>
        {choices.map((_, index) => (
          <option key={index} value={index}>
            Option {index + 1}
          </option>
        ))}
      </Select>
    </div>
    <Button variant="success" onClick={addChoice} className="mt-4">
      + Add Another Choice
    </Button>
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
      <FormLabel>{label}</FormLabel>
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
  <SectionWrapper title="4. Question Reference Images (Optional)">
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

const ActionFooter = ({ children }) => (
  <div className="flex items-center justify-end gap-4 mt-12 pt-6 border-t-2 border-gray-200">
    {children}
  </div>
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
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={applyCrop}>
            Apply Crop
          </Button>
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
    unit_no: "",
    topic: "",
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

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imgElementForCrop, setImgElementForCrop] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Data Fetching and Handlers (Largely Unchanged) ---

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
          (paper) => paper.createdQuestionsCount < paper.numberOfQuestions
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
            unit_no: q.unit_no || "",
            topic: q.topic || "",
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

  const applyCrop = useCallback(async () => {
    if (!croppedAreaPixels || !imgElementForCrop) {
      toast.error("Please make a crop selection.");
      return;
    }

    setLoading(true);
    try {
      const scaleX = imgElementForCrop.naturalWidth / imgElementForCrop.width;
      const scaleY = imgElementForCrop.naturalHeight / imgElementForCrop.height;

      const correctedCrop = {
        x: croppedAreaPixels.x * scaleX,
        y: croppedAreaPixels.y * scaleY,
        width: croppedAreaPixels.width * scaleX,
        height: croppedAreaPixels.height * scaleY,
      };

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
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error("Error submitting question:", err);
        const errorMessage = `Question submission failed!`;
        toast.error(errorMessage, { id: toastId });
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate]
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto relative">
        <div className="p-6 sm:p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            {id ? "Edit Question" : "Create New Question"}
          </h1>
          <p className="text-gray-500 mb-8 border-b pb-4">
            Fill in all the details to create a comprehensive question.
          </p>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-40 rounded-xl">
            <Loader />
          </div>
        )}

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-8 space-y-8"
        >
          <QuestionPaperDetailsInputs
            formData={formData}
            questionPapers={questionPapers}
            onPaperSelect={handleQuestionPaperChange}
          />

          <ContentInputSection
            label="2. Question Details"
            textName="questionText"
            textValue={formData.questionText}
            imageValue={formData.questionImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "questionImage")}
            onRemoveImage={() => handleRemoveImage("questionImage")}
            className="bg-gray-50/50"
          >
            <div className="mb-4">
              <FormLabel htmlFor="questionNumber">Question Number</FormLabel>
              <Input
                id="questionNumber"
                type="text"
                name="questionNumber"
                placeholder="e.g., 1a, II.3"
                value={formData.questionNumber}
                onChange={handleInputChange}
                className="sm:w-1/2"
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
            label="5. Explanation (Optional)"
            textName="explanation"
            textValue={formData.explanation}
            imageValue={formData.explanationImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "explanationImage")}
            onRemoveImage={() => handleRemoveImage("explanationImage")}
          />

          <SectionWrapper title="6. Additional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <FormLabel htmlFor="unit">Unit</FormLabel>
                <Input
                  id="unit"
                  type="text"
                  name="unit"
                  placeholder="Enter unit name..."
                  value={formData.unit}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <FormLabel htmlFor="unit_no">Unit Number</FormLabel>
                <Input
                  id="unit_no"
                  type="text"
                  name="unit_no"
                  placeholder="Enter unit number..."
                  value={formData.unit_no}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <FormLabel htmlFor="topic">Topic</FormLabel>
                <Input
                  id="topic"
                  type="text"
                  name="topic"
                  placeholder="Enter topic..."
                  value={formData.topic}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <FormLabel htmlFor="complexity">Complexity</FormLabel>
                <Select
                  id="complexity"
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleInputChange}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <FormLabel htmlFor="keywords">
                  Keywords (comma-separated)
                </FormLabel>
                <Input
                  id="keywords"
                  type="text"
                  name="keywords"
                  placeholder="e.g. algebra, equations"
                  value={formData.keywords}
                  onChange={handleInputChange}
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

          <ActionFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit("Draft")}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit("Submit")}
              disabled={loading}
            >
              Submit for Approval
            </Button>
          </ActionFooter>
        </form>
      </div>

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
