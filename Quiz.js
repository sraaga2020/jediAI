import { useState, useEffect } from "react";

function Quiz({ subtopic }) {
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subtopic) return;

    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/generate-quiz/?subtopic=${encodeURIComponent(subtopic)}&num_questions=3`
        );
        const data = await res.json();
        setQuestions(data.quiz || []);
        setSelected({}); // reset selected answers for new quiz
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [subtopic]);

  const handleSelect = (qIndex, option) => {
    setSelected((prev) => ({ ...prev, [qIndex]: option }));
  };

  if (loading) {
    return <p className="text-sm text-gray-500 mt-2">Loading quiz...</p>;
  }

  if (!questions.length) return null;

  return (
    <div className="border p-4 rounded mt-4 bg-gray-50">
      <h4 className="font-semibold mb-2">Quiz for {subtopic}</h4>

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="mb-3">
          <p className="mb-1">{q.question}</p>
          <div className="space-y-1">
            {q.options.map((option, idx) => {
              const isSelected = selected[qIndex] === option;
              const isCorrect = option === q.answer;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(qIndex, option)}
                  className={`px-3 py-1 rounded w-full text-left ${
                    isSelected
                      ? isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Quiz;
