import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import Modal from "react-modal";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
import { FaArrowLeft } from "react-icons/fa";

const Section = ({ title, children, className }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
    <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    <p className="text-lg text-gray-900">{value}</p>
  </div>
);

const ImageViewer = ({ src, alt }) => (
  <div className="mt-2">
    <img src={src} alt={alt} className="rounded-lg max-w-full h-auto border border-gray-200" />
  </div>
);

export default function ExpertQuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFinalized = location.pathname.includes("finalized-question");

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const token = localStorage.getItem("token");
        const url = isFinalized
          ? `${host}/api/expert/finalized-questions/${id}`
          : `${host}/api/expert/questions/${id}`;

        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestion(data.data);
      } catch (error) {
        console.error("Failed to fetch question details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id, isFinalized]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader /></div>;
  }

  if (!question) {
    return <div className="text-center text-red-500 mt-10">Question not found.</div>;
  }

  const {
    question: q,
    options,
    explanation,
    subject,
    complexity,
    keywords,
    questionPaper,
    unit,
    chapter,
  } = question;

  const correctAnswerIndex = options.findIndex(option => option.isCorrect);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const proceedToFinalize = () => {
    closeModal();
    navigate(`/expert/question/edit/${id}`);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold"
        >
          <FaArrowLeft />
          Back
        </button>

        <div className="space-y-8">
          <Section title="Question Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem label="Course" value={questionPaper?.course?.title || "N/A"} />
              <DetailItem label="Subject" value={subject || "N/A"} />
              <DetailItem label="Question Paper" value={questionPaper?.name || "N/A"} />
              <DetailItem label="Complexity" value={complexity || "N/A"} />
              <DetailItem label="Unit" value={unit || "N/A"} />
              <DetailItem label="Topic" value={chapter || "N/A"} />
            </div>
            {keywords && keywords.length > 0 && (
              <div className="pt-4">
                <p className="text-sm font-semibold text-gray-500">Keywords</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {keywords.map((keyword, index) => (
                    <span key={index} className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Question">
            {q.text && <p className="text-lg text-gray-800 leading-relaxed">{q.text}</p>}
            {q.image && <ImageViewer src={q.image} alt="Question" />}
          </Section>

          <Section title="Options">
            <div className="space-y-4">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    index === correctAnswerIndex
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <p className="font-semibold text-gray-800">
                    Option {index + 1}
                    {index === correctAnswerIndex && <span className="text-green-600 font-bold ml-2">(Correct Answer)</span>}
                  </p>
                  {option.text && <p className="mt-1 text-gray-700">{option.text}</p>}
                  {option.image && <ImageViewer src={option.image} alt={`Option ${index + 1}`} />}
                </div>
              ))}
            </div>
          </Section>

          {explanation && (
            <Section title="Explanation">
              {explanation.text && <p className="text-gray-800 leading-relaxed">{explanation.text}</p>}
              {explanation.image && <ImageViewer src={explanation.image} alt="Explanation" />}
            </Section>
          )}

          {!isFinalized && (
            <Section title="Actions">
              <div className="flex justify-end gap-4">
                <Link
                  to={`/expert/question/edit/${id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Edit
                </Link>
                <button
                  onClick={openModal}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Finalize
                </button>
              </div>
            </Section>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4"
        overlayClassName="fixed inset-0 z-50"
      >
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Confirm Finalization</h2>
          <p className="text-gray-700 mb-6">
            You will be redirected to the edit page to confirm the details and complete the finalization. Please ensure all fields, including Unit No, are filled in correctly.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={closeModal}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Cancel
            </button>
            <button
              onClick={proceedToFinalize}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Proceed to Finalize
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}