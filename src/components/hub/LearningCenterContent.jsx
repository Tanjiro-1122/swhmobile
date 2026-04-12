import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, Clock, ArrowLeft, GraduationCap, TrendingUp, Brain, 
  CheckCircle2, Play, Trophy, ChevronRight 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { lessons, getAllLessons } from "@/components/learning/LessonContent";
import QuizComponent from "@/components/learning/QuizComponent";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const levelConfig = {
  beginner: { 
    label: "Beginner", 
    icon: GraduationCap, 
    color: "green",
    bgClass: "data-[state=active]:bg-green-500 data-[state=active]:text-white"
  },
  intermediate: { 
    label: "Intermediate", 
    icon: TrendingUp, 
    color: "yellow",
    bgClass: "data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
  },
  advanced: { 
    label: "Advanced", 
    icon: Brain, 
    color: "red",
    bgClass: "data-[state=active]:bg-red-500 data-[state=active]:text-white"
  }
};

const LessonCard = ({ lesson, _level, isCompleted, onSelect }) => {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
          isCompleted 
            ? 'border-green-500/30 bg-green-500/5' 
            : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'
        }`}
        onClick={() => onSelect(lesson)}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-purple-400 ml-0.5" />
                </div>
              )}
            </div>
            {lesson.quiz && (
              <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                <Trophy className="w-3 h-3 mr-1" />
                Has Quiz
              </Badge>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">{lesson.title}</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              {lesson.duration}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LessonViewer = ({ lesson, onBack, onComplete, isCompleted }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [_hasReadLesson, setHasReadLesson] = useState(false);

  useEffect(() => {
    // Mark lesson as read after 10 seconds of viewing
    const timer = setTimeout(() => setHasReadLesson(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (showQuiz && lesson.quiz) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setShowQuiz(false)} 
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lesson
        </Button>
        
        <Card className="border-2 border-purple-500/30 bg-slate-800/50">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-purple-400" />
              Quiz: {lesson.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <QuizComponent 
              quiz={lesson.quiz}
              lessonTitle={lesson.title}
              onComplete={() => {
                onComplete(lesson.id);
                onBack();
              }}
              onRetry={() => setShowQuiz(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lessons
      </Button>
      
      <Card className="border-2 border-slate-700 bg-slate-800/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-900/50 to-slate-800 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-white">
              <BookOpen className="w-6 h-6 text-purple-400" />
              {lesson.title}
            </CardTitle>
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="text-slate-400 border-slate-600">
              <Clock className="w-3 h-3 mr-1" />
              {lesson.duration}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <ScrollArea className="h-[500px] pr-4">
            <div className="prose prose-invert prose-purple max-w-none 
              prose-headings:text-white prose-headings:font-bold
              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-purple-300
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-li:text-slate-300
              prose-strong:text-white
              prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-purple-300
            ">
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quiz CTA */}
      {lesson.quiz && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Ready to Test Your Knowledge?</h4>
                    <p className="text-sm text-slate-400">
                      Take the quiz to complete this lesson ({lesson.quiz.length} questions)
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowQuiz(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Start Quiz
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

const ProgressOverview = ({ completedLessons, totalLessons }) => {
  const percentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  
  return (
    <Card className="border-slate-700 bg-slate-800/50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-white">Your Progress</h4>
              <p className="text-sm text-slate-400">
                {completedLessons.length} of {totalLessons} lessons completed
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-purple-400">{percentage}%</span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default function LearningCenterContent() {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const queryClient = useQueryClient();

  // Get user's completed lessons from their profile
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const completedLessons = user?.completed_lessons || [];
  const allLessons = getAllLessons();

  const updateCompletedLessons = useMutation({
    mutationFn: async (lessonId) => {
      const updated = [...new Set([...completedLessons, lessonId])];
      await base44.auth.updateMe({ completed_lessons: updated });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleCompleteLesson = (lessonId) => {
    if (!completedLessons.includes(lessonId)) {
      updateCompletedLessons.mutate(lessonId);
    }
  };

  if (selectedLesson) {
    return (
      <LessonViewer
        lesson={selectedLesson}
        onBack={() => setSelectedLesson(null)}
        onComplete={handleCompleteLesson}
        isCompleted={completedLessons.includes(selectedLesson.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProgressOverview 
        completedLessons={completedLessons} 
        totalLessons={allLessons.length} 
      />

      <Tabs defaultValue="beginner" className="space-y-6">
        <TabsList className="bg-slate-800 p-1 border border-slate-700">
          {Object.entries(levelConfig).map(([level, config]) => {
            const Icon = config.icon;
            const levelLessons = lessons[level] || [];
            const completedCount = levelLessons.filter(l => completedLessons.includes(l.id)).length;
            
            return (
              <TabsTrigger 
                key={level}
                value={level} 
                className={`${config.bgClass} relative`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {config.label}
                {completedCount > 0 && (
                  <Badge className="ml-2 bg-white/20 text-xs px-1.5">
                    {completedCount}/{levelLessons.length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(lessons).map(([level, levelLessons]) => (
          <TabsContent key={level} value={level} className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {levelLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  level={level}
                  isCompleted={completedLessons.includes(lesson.id)}
                  onSelect={setSelectedLesson}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}