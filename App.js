import { useState } from "react";

function App() {
  const [topic, setTopic] = useState("");
  const [learningPath, setLearningPath] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [videosBySubtopic, setVideosBySubtopic] = useState({});
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [completedSubtopics, setCompletedSubtopics] = useState({});
  const [activeQuizSubtopic, setActiveQuizSubtopic] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);

  // Fetch videos for a subtopic
  const fetchVideosForSubtopic = async (subtopic) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/youtube-search/?query=${encodeURIComponent(
          `${topic} ${subtopic}`
        )}&max_results=3`
      );
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error("Failed to fetch videos for", subtopic, err);
      return [];
    }
  };

  // Fetch learning path
  const fetchLearningPath = async () => {
    if (!topic.trim()) return;
    setLoadingRoadmap(true);
    setLearningPath(null);
    setVideosBySubtopic({});
    setCompletedSubtopics({});

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/generate-path/?topic=${encodeURIComponent(topic)}`
      );
      const data = await res.json();
      setLearningPath(data.learning_path);

      setLoadingVideos(true);
      const videoMap = {};
      for (const phase of Object.values(data.learning_path)) {
        for (const item of phase) {
          videoMap[item.subtopic] = await fetchVideosForSubtopic(item.subtopic);
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      setVideosBySubtopic(videoMap);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch learning path or videos.");
    } finally {
      setLoadingRoadmap(false);
      setLoadingVideos(false);
    }
  };

  const fetchQuiz = async (subtopic) => {
    setActiveQuizSubtopic(subtopic);
    setQuizLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/generate-quiz/?subtopic=${encodeURIComponent(subtopic)}&num_questions=3`
      );
      const data = await res.json();
      setQuizQuestions(data.quiz || []);
    } catch (err) {
      console.error(err);
      setQuizQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const phaseDisplayNames = { "Phase 1": "Beginner", "Phase 2": "Intermediate", "Phase 3": "Advanced" };
  const totalSubtopics = learningPath ? Object.values(learningPath).reduce((sum, lvl) => sum + lvl.length, 0) : 0;
  const completedCount = Object.values(completedSubtopics).filter(Boolean).length;
  const progressPercentage = totalSubtopics ? (completedCount / totalSubtopics) * 100 : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">JEDI</h1>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic..."
        className="border p-2 rounded w-full mb-4"
      />

      <button
        onClick={fetchLearningPath}
        disabled={loadingRoadmap}
        className={`px-4 py-2 rounded text-white ${loadingRoadmap ? "bg-gray-400" : "bg-green-500"}`}
      >
        {loadingRoadmap ? "Generating Path..." : "Generate Learning Path"}
      </button>

      {learningPath && (
        <div className="mt-4 mb-4">
          <div className="w-full bg-gray-300 h-4 rounded">
            <div className="bg-green-500 h-4 rounded" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-sm mt-1">{completedCount} of {totalSubtopics} subtopics completed</p>
        </div>
      )}

      {learningPath &&
        Object.keys(learningPath).map((phaseKey) => (
          <div key={phaseKey} className="mb-8">
            <h3 className="text-xl font-semibold mb-2">{phaseDisplayNames[phaseKey] || phaseKey}</h3>
            {learningPath[phaseKey].map((item, idx) => (
              <div key={idx} className="border rounded p-4 mb-4">
                <h4 className="font-bold">{item.subtopic}</h4>
                <p className="text-gray-700 mb-2">{item.description}</p>

                {/* Resources */}
                {item.resources?.length > 0 && (
                  <div className="ml-4 mb-2">
                    <h5 className="font-semibold">📚 Resources:</h5>
                    <ul className="list-disc pl-5">
                      {item.resources.map((res, i) => (
                        <li key={i}><a href={res} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{res}</a></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Videos */}
                <h5 className="font-semibold mt-2">🎥 Recommended Videos</h5>
                {loadingVideos ? <p className="text-sm text-gray-500">Loading videos...</p> :
                  <ul className="mt-2 space-y-2">
                    {(videosBySubtopic[item.subtopic] || []).map((video, i) => (
                      <li key={i} className="flex gap-3">
                        <img src={video.thumbnail} alt={video.title} className="w-32 rounded" />
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{video.title}</a>
                      </li>
                    ))}
                  </ul>
                }

                {/* Mark Completed */}
                <button
                  onClick={() => setCompletedSubtopics(prev => ({ ...prev, [item.subtopic]: !prev[item.subtopic] }))}
                  className={`mt-2 px-3 py-1 rounded ${completedSubtopics[item.subtopic] ? "bg-gray-400" : "bg-blue-500"} text-white`}
                >
                  {completedSubtopics[item.subtopic] ? "Completed ✅" : "Mark Completed"}
                </button>

                {/* Quiz */}
                <button onClick={() => fetchQuiz(item.subtopic)} className="mt-2 ml-2 px-3 py-1 rounded bg-purple-500 text-white">Take Quiz</button>
              </div>
            ))}
          </div>
        ))}

      {/* Topic Chat */}
      {learningPath && <TopicChat topic={topic} />}

      {/* Quiz Popup */}
      {activeQuizSubtopic && (
        <>
          <div className="fixed inset-0 bg-black opacity-30 z-40" onClick={() => setActiveQuizSubtopic(null)} />
          <div className="fixed top-20 right-6 w-96 border rounded bg-white shadow-lg p-4 z-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Quiz: {activeQuizSubtopic}</h4>
              <button onClick={() => setActiveQuizSubtopic(null)} className="text-red-500 font-bold">✕</button>
            </div>
            {quizLoading ? <p>Loading...</p> : (
              <ul>
                {quizQuestions.map((q, i) => (
                  <li key={i} className="mb-2">
                    <strong>{q.question}</strong>
                    <ul className="list-disc pl-5">
                      {q.options.map((opt, j) => <li key={j}>{opt}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TopicChat({ topic }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/chat/?topic=${encodeURIComponent(topic)}&question=${encodeURIComponent(question)}`
      );
      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      setAnswer("Error: could not get response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded mt-4">
      <h3 className="font-bold mb-2">Ask about {topic}</h3>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question..."
        className="border p-2 w-full mb-2 rounded"
      />
      <button onClick={askQuestion} disabled={loading || !question} className="bg-blue-500 text-white px-3 py-1 rounded">
        {loading ? "Thinking..." : "Ask"}
      </button>
      {answer && <p className="mt-2 bg-gray-100 p-2 rounded">{answer}</p>}
    </div>
  );
}

export default App;
