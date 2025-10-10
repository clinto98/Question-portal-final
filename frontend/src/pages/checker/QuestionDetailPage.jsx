import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";

// --- Reusable Modal Components ---

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  isLoading,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{message}</h2>
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
        <p className="text-gray-800 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// --- Helper Components ---

const AccordionSection = ({ title, children, isOpen, onToggle }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex justify-between items-center text-left p-6 font-bold text-xl text-gray-800 focus:outline-none hover:bg-gray-50 transition"
    >
      <span>{title}</span>
      <svg
        className={`w-6 h-6 transform transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>
    {isOpen && (
      <div className="p-6 pt-0 border-t border-gray-200">{children}</div>
    )}
  </div>
);

const DetailItem = ({ label, children }) => (
  <div>
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    <div className="text-md text-gray-800 break-words mt-1">{children}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusStyles = {
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`px-4 py-1.5 text-sm font-bold rounded-full ${
        statusStyles[status] || ""
      }`}
    >
      {status}
    </span>
  );
};

// --- Main Component ---

const RenderReferenceImages = ({ reference, onImageClick }) =>
  (reference?.image1 || reference?.image2) && (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">
        Reference Images
      </h2>
      <div className="flex flex-col gap-4">
        {reference.image1 && (
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2">
              Reference Image 1
            </p>
            <img
              src={reference.image1}
              alt="Reference 1"
              className="rounded-lg max-h-48 w-full object-contain border p-2 cursor-pointer"
              onClick={() => onImageClick(reference.image1)}
            />
          </div>
        )}
        {reference.image2 && (
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2">
              Reference Image 2
            </p>
            <img
              src={reference.image2}
              alt="Reference 2"
              className="rounded-lg max-h-48 w-full object-contain border p-2 cursor-pointer"
              onClick={() => onImageClick(reference.image2)}
            />
          </div>
        )}
      </div>
    </div>
  );

const FullscreenImage = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100]"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Fullscreen"
        className="max-h-[90vh] max-w-[90vw] object-contain"
      />
    </div>
  );
};

const ActionToolbar = ({
  comment,
  onCommentChange,
  onReject,
  onApprove,
  isSubmitting,
}) => (
  <div className=" bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4 z-10">
    <div className="max-w-xl mx-auto">
      <div>
        <label
          htmlFor="rejection-comment"
          className="font-semibold text-gray-700 mb-2 block"
        >
          Feedback / Rejection Comment:
        </label>
        <textarea
          id="rejection-comment"
          value={comment}
          onChange={onCommentChange}
          placeholder="Provide clear feedback if rejecting..."
          className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={onReject}
          disabled={isSubmitting}
          className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700 transition disabled:bg-gray-400"
        >
          {isSubmitting ? "Rejecting..." : "Reject"}
        </button>
        <button
          onClick={onApprove}
          disabled={isSubmitting}
          className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {isSubmitting ? "Approving..." : "Approve"}
        </button>
      </div>
    </div>
  </div>
);

const QuestionContent = ({ question, onImageClick }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-6 space-y-8">
      {/* Question Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">
          Question
        </h3>
        {question.question.image && (
          <img
            src={question.question.image}
            alt="Question"
            className="rounded-lg max-h-80 w-auto mb-4 border p-2 cursor-pointer"
            onClick={() => onImageClick(question.question.image)}
          />
        )}
        <div className="max-w-prose">
          <p className="text-lg whitespace-pre-wrap">
            {question.question.text}
          </p>
        </div>
      </div>

      <hr />

      {/* Options Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">
          Options
        </h3>
        <ul className="space-y-3">
          {question.options.map((opt, idx) => (
            <li
              key={idx}
              className={`p-4 rounded-lg flex items-start gap-4 ${
                opt.isCorrect
                  ? "bg-green-100 border-green-300 border-2"
                  : "bg-gray-100"
              }`}
            >
              <span
                className={`font-bold text-lg ${
                  opt.isCorrect ? "text-green-700" : "text-gray-600"
                }`}
              >
                {idx + 1}.
              </span>
              <div className="flex-grow max-w-prose">
                {opt.image && (
                  <img
                    src={opt.image}
                    alt={`Option ${idx + 1}`}
                    className="rounded max-h-40 w-auto mb-2 border cursor-pointer"
                    onClick={() => onImageClick(opt.image)}
                  />
                )}
                <p>{opt.text}</p>
              </div>
              {opt.isCorrect && (
                <span className="font-bold text-green-700 self-center">
                  (Correct Answer)
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Explanation Section */}
      {question.explanation?.text && (
        <>
          <hr />
          <div>
            <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">
              Explanation
            </h3>
            {question.explanation.image && (
              <img
                src={question.explanation.image}
                alt="Explanation"
                className="rounded-lg max-h-80 w-auto mb-4 border p-2 cursor-pointer"
                onClick={() => onImageClick(question.explanation.image)}
              />
            )}
            <div className="max-w-prose p-4 bg-blue-50 rounded-md">
              <p className="whitespace-pre-wrap">
                {question.explanation.text}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

export default function QuestionDetailPage() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  const [openSections, setOpenSections] = useState({
    "Question Overview": true,
    Metadata: true,
    "Reference Images": true,
    "Review Information": false,
  });

  const handleToggleSection = (sectionTitle) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  });
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/checker/questions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestion(res.data);
      } catch (err) {
        console.error("Error fetching question details:", err);
        setError(
          "Failed to load question. It may not exist or you may not have permission to view it."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id]);

  const handleAction = useCallback(
    async (action) => {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const url = `${host}/api/checker/questions/${id}/${action}`;
      const payload = action === "reject" ? { comments: comment } : {};

      try {
        await axios.put(url, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification({
          isOpen: true,
          message: `Question ${action}ed successfully!`,
        });
      } catch (err) {
        console.error(`Error ${action}ing question:`, err);
        setNotification({
          isOpen: true,
          message: `Failed to ${action} the question.`,
        });
      } finally {
        setIsSubmitting(false);
        setConfirmation({ isOpen: false, message: "", onConfirm: () => {} });
      }
    },
    [id, comment, host]
  );

  const onApprove = () =>
    setConfirmation({
      isOpen: true,
      message: "Are you sure you want to approve this question?",
      onConfirm: () => handleAction("approve"),
    });

  const onReject = () => {
    if (!comment.trim()) {
      setNotification({
        isOpen: true,
        message: "Please provide a comment before rejecting.",
      });
      return;
    }
    setConfirmation({
      isOpen: true,
      message: "Are you sure you want to reject this question?",
      onConfirm: () => handleAction("reject"),
    });
  };

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="text-center py-20 text-red-600 font-semibold">
        {error}
      </div>
    );
  if (!question)
    return (
      <div className="text-center py-20 text-gray-500">
        No question data found.
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-white px-4 py-2 rounded-md shadow-sm text-gray-700 hover:bg-gray-100 font-semibold"
          >
            &larr; Back to List
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column for sticky reference images */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <RenderReferenceImages
                reference={question.reference}
                onImageClick={setFullscreenImage}
              />
            </div>
          </div>

          {/* Right Column for main content */}
          <div className="lg:col-span-2 space-y-4">
            <AccordionSection
              title="Question Overview"
              isOpen={openSections["Question Overview"]}
              onToggle={() => handleToggleSection("Question Overview")}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6">
                <DetailItem label="Course">
                  {question.course?.title || "N/A"}
                </DetailItem>
                <DetailItem label="Subject">
                  {question.subject || "N/A"}
                </DetailItem>
                <div className="flex-shrink-0">
                  <StatusBadge status={question.status} />
                </div>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Metadata"
              isOpen={openSections["Metadata"]}
              onToggle={() => handleToggleSection("Metadata")}
            >
              <div className="p-6 space-y-6">
                {/* Classification Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
                  <DetailItem label="Unit">
                    {question.unit || "N/A"}
                  </DetailItem>
                  <DetailItem label="Complexity">
                    {question.complexity || "N/A"}
                  </DetailItem>
                  <DetailItem label="Question Number">
                    {question.questionNumber || "N/A"}
                  </DetailItem>
                  <DetailItem label="Keywords">
                    {Array.isArray(question.keywords)
                      ? question.keywords.join(", ")
                      : "N/A"}
                  </DetailItem>
                </div>

                {/* Source Material Group */}
                <div className="space-y-4">
                   <DetailItem label="Question Paper">
                      <p className="font-semibold text-gray-800">
                        {question.questionPaper?.name || "N/A"}
                      </p>
                      <div className="flex items-center flex-wrap gap-3 mt-2">
                        {question.questionPaper?.questionPaperFile?.url && (
                          <button
                            onClick={() =>
                              window.open(
                                question.questionPaper.questionPaperFile.url,
                                "_blank"
                              )
                            }
                            className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition"
                          >
                            View Question PDF
                          </button>
                        )}
                        {question.questionPaper?.solutionPaperFile?.url && (
                          <button
                            onClick={() =>
                              window.open(
                                question.questionPaper.solutionPaperFile.url,
                                "_blank"
                              )
                            }
                            className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full hover:bg-green-200 transition"
                          >
                            View Solution PDF
                          </button>
                        )}
                      </div>
                    </DetailItem>
                </div>
              </div>
            </AccordionSection>

            {/* Reference Images for smaller screens */}
            {(question.reference?.image1 || question.reference?.image2) && (
              <div className="lg:hidden">
                <AccordionSection
                  title="Reference Images"
                  isOpen={openSections["Reference Images"]}
                  onToggle={() => handleToggleSection("Reference Images")}
                >
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {question.reference.image1 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">
                          Reference Image 1
                        </p>
                        <img
                          src={question.reference.image1}
                          alt="Reference 1"
                          className="rounded-lg max-h-80 w-auto border p-2 cursor-pointer"
                          onClick={() =>
                            setFullscreenImage(question.reference.image1)
                          }
                        />
                      </div>
                    )}
                    {question.reference.image2 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">
                          Reference Image 2
                        </p>
                        <img
                          src={question.reference.image2}
                          alt="Reference 2"
                          className="rounded-lg max-h-80 w-auto border p-2 cursor-pointer"
                          onClick={() =>
                            setFullscreenImage(question.reference.image2)
                          }
                        />
                      </div>
                    )}
                  </div>
                </AccordionSection>
              </div>
            )}

            <QuestionContent
              question={question}
              onImageClick={setFullscreenImage}
            />

            <AccordionSection
              title="Review Information"
              isOpen={openSections["Review Information"]}
              onToggle={() => handleToggleSection("Review Information")}
            >
              <div className="p-6 space-y-4">
                <DetailItem label="Created By (Maker)">
                  {question.maker?.name || "N/A"}
                </DetailItem>
                {question.status === "Rejected" && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-500">
                      Rejection Comments
                    </p>
                    <p className="text-md text-red-700 bg-red-50 p-3 rounded-md mt-1">
                      {question.checkerComments}
                    </p>
                  </div>
                )}
              </div>
            </AccordionSection>
          </div>
        </div>
      </div>

      {/* Modals and Sticky Toolbar */}
      {question.status === "Pending" && (
        <ActionToolbar
          comment={comment}
          onCommentChange={(e) => setComment(e.target.value)}
          onReject={onReject}
          onApprove={onApprove}
          isSubmitting={isSubmitting}
        />
      )}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        message={confirmation.message}
        isLoading={isSubmitting}
      />
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => {
          setNotification({ ...notification, isOpen: false });
          navigate(-1);
        }}
        message={notification.message}
      />
      <FullscreenImage
        src={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </div>
  );
}
