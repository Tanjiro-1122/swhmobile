import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizComponent({ quiz, _lessonTitle, onComplete, onRetry }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = quiz[currentQuestion];
  const isCorrect = selectedAnswer === question?.correct;

  const handleSelectAnswer = (index) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    setAnswers([...answers, { questionIndex: currentQuestion, selected: selectedAnswer, correct: question.correct }]);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const totalQuestions = quiz.length;
  const passThreshold = Math.ceil(totalQuestions * 0.7);

  if (quizComplete) {
    const finalCorrect = answers.filter(a => a.selected === a.correct).length;
    const passed = finalCorrect >= passThreshold;
    const percentage = Math.round((finalCorrect / totalQuestions) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
          passed ? 'bg-green-500/20' : 'bg-orange-500/20'
        }`}>
          {passed ? (
            <Trophy className="w-12 h-12 text-green-400" />
          ) : (
            <RotateCcw className="w-12 h-12 text-orange-400" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          {passed ? "Quiz Passed! 🎉" : "Keep Learning!"}
        </h3>
        
        <p className="text-slate-400 mb-4">
          You scored {finalCorrect} out of {totalQuestions} ({percentage}%)
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          {quiz.map((_, i) => {
            const answer = answers[i];
            const wasCorrect = answer?.selected === answer?.correct;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  wasCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            );
          })}
        </div>

        {passed ? (
          <div className="space-y-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-4 py-2">
              Lesson Complete!
            </Badge>
            <div>
              <Button onClick={() => onComplete?.()} className="bg-purple-600 hover:bg-purple-700">
                Continue Learning
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm">
              You need {passThreshold}/{totalQuestions} correct to pass. Review the lesson and try again!
            </p>
            <Button onClick={() => onRetry?.()} variant="outline" className="border-slate-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Review & Retry
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Question {currentQuestion + 1} of {totalQuestions}</span>
        <div className="flex items-center gap-2">
          {quiz.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < currentQuestion
                  ? answers[i]?.selected === answers[i]?.correct
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : i === currentQuestion
                  ? 'bg-purple-500 w-4'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correct;
              
              let className = "w-full text-left p-4 rounded-xl border-2 transition-all ";
              
              if (showResult) {
                if (isCorrectAnswer) {
                  className += "border-green-500 bg-green-500/10 text-white";
                } else if (isSelected && !isCorrectAnswer) {
                  className += "border-red-500 bg-red-500/10 text-white";
                } else {
                  className += "border-slate-700 bg-slate-800/50 text-slate-400";
                }
              } else {
                if (isSelected) {
                  className += "border-purple-500 bg-purple-500/10 text-white";
                } else {
                  className += "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  className={className}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      showResult
                        ? isCorrectAnswer
                          ? 'bg-green-500 text-white'
                          : isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                        : isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrectAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    )}
                    {showResult && isSelected && !isCorrectAnswer && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className={`border-2 ${isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
                      {isCorrect ? "Correct!" : "Not quite!"}
                    </p>
                    <p className="text-slate-300 text-sm mt-1">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        {!showResult ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
            {currentQuestion < quiz.length - 1 ? (
              <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
            ) : (
              <>See Results <Trophy className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}