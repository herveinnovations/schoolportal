import React, { useState, useEffect, useRef } from 'react';
import { useAuth, type Exam, type ExamAttempt } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';
import { Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';

interface ExamTakingProps {
  exam: Exam;
  attempt: ExamAttempt;
  onBack: () => void;
  onSubmit: (attemptId: string, isAutoSubmit: boolean) => void;
  onUpdateAnswer: (attemptId: string, questionId: string, answer: string) => void;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({ exam, attempt, onBack, onSubmit, onUpdateAnswer }) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const fired = useRef(false);

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  const answeredCount = Object.keys(attempt.answers).length;

  useEffect(() => {
    const startTime = new Date(attempt.startTime).getTime();
    const duration = exam.duration * 60 * 1000;
    const endTime = startTime + duration;

    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeRemaining(remaining);
      if (remaining === 0 && !attempt.isSubmitted && !fired.current) {
        fired.current = true;
        setIsAutoSubmitting(true);
        setTimeout(() => onSubmit(attempt.id, true), 1000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [attempt, exam.duration, onSubmit]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const m = timeRemaining / 60000;
    if (m <= 5) return 'text-red-600';
    if (m <= 15) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleAnswerChange = (answer: string) => onUpdateAnswer(attempt.id, currentQuestion.id, answer);
  const handleNext = () => { if (currentQuestionIndex < exam.questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1); };
  const handlePrevious = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1); };
  const handleSubmit = () => {
    if (answeredCount < exam.questions.length) setShowSubmitConfirm(true);
    else onSubmit(attempt.id, false);
  };

  if (isAutoSubmitting) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Clock className="w-16 h-16 mx-auto text-red-600 mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Time's Up!</h2>
            <p className="text-stone-600">Your exam is being automatically submitted...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-stone-50">
      <div className="fixed inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1640841932394-7e135c0c6c3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBsaWJyYXJ5JTIwYm9va3N8ZW58MXx8fHwxNzY5NzQ2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/98 via-white/95 to-amber-50/98"></div>
      </div>

      <div className="relative z-10">
        <header className="bg-white/90 backdrop-blur-md shadow-md sticky top-0 z-50 border-b-2 border-emerald-200">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button onClick={onBack} className="text-xs text-stone-500 hover:text-emerald-700 mb-0.5">← Leave for now (the timer keeps running)</button>
                <h1 className="text-xl font-bold text-stone-900">{exam.title}</h1>
                <p className="text-sm text-stone-600">{exam.courseName}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-stone-600">Time Remaining</div>
                  <div className={`text-3xl font-bold font-mono ${getTimeColor()}`}>{formatTime(timeRemaining)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-stone-600">Progress</div>
                  <div className="text-xl font-bold">{answeredCount}/{exam.questions.length}</div>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </header>

        {timeRemaining <= 5 * 60 * 1000 && timeRemaining > 0 && (
          <div className="max-w-5xl mx-auto px-4 pt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning: Low Time!</AlertTitle>
              <AlertDescription>You have less than 5 minutes remaining. Please submit your exam soon.</AlertDescription>
            </Alert>
          </div>
        )}

        <main className="max-w-5xl mx-auto px-4 py-6">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">Question {currentQuestionIndex + 1} of {exam.questions.length}</Badge>
                    <Badge>{currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}</Badge>
                    {attempt.answers[currentQuestion.id] && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Answered
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <RadioGroup value={attempt.answers[currentQuestion.id] || ''} onValueChange={handleAnswerChange}>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                        onClick={() => handleAnswerChange(option)}>
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === 'true-false' && (
                <RadioGroup value={attempt.answers[currentQuestion.id] || ''} onValueChange={handleAnswerChange}>
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                        onClick={() => handleAnswerChange(option)}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="flex-1 cursor-pointer text-base">{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === 'short-answer' && (
                <div>
                  <Label className="text-base mb-2 block">Your Answer:</Label>
                  <Textarea value={attempt.answers[currentQuestion.id] || ''} onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Type your answer here..." rows={3} className="text-base" />
                </div>
              )}

              {currentQuestion.type === 'essay' && (
                <div>
                  <Label className="text-base mb-2 block">Your Essay:</Label>
                  <Textarea value={attempt.answers[currentQuestion.id] || ''} onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Write your essay here..." rows={10} className="text-base" />
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t">
                <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0} variant="outline" size="lg">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <div className="text-sm text-stone-600">{answeredCount} of {exam.questions.length} questions answered</div>
                {currentQuestionIndex < exam.questions.length - 1 ? (
                  <Button onClick={handleNext} size="lg">Next <ChevronRight className="w-4 h-4 ml-2" /></Button>
                ) : (
                  <Button onClick={handleSubmit} size="lg" className="bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-2" /> Submit Exam
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Question Overview</CardTitle>
              <CardDescription>Click on any question to jump to it</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {exam.questions.map((q, index) => (
                  <button key={q.id} onClick={() => setCurrentQuestionIndex(index)}
                    className={`aspect-square flex items-center justify-center rounded-lg font-medium transition ${
                      index === currentQuestionIndex ? 'bg-emerald-700 text-white'
                        : attempt.answers[q.id] ? 'bg-green-600 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}>
                    {index + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Submit Exam?</CardTitle>
                <CardDescription>
                  You have answered {answeredCount} out of {exam.questions.length} questions.
                  {answeredCount < exam.questions.length && (
                    <span className="text-yellow-600 font-medium block mt-2">
                      Warning: You have {exam.questions.length - answeredCount} unanswered question(s).
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button onClick={() => setShowSubmitConfirm(false)} variant="outline" className="flex-1">Review Answers</Button>
                <Button onClick={() => onSubmit(attempt.id, false)} className="flex-1 bg-green-600 hover:bg-green-700">Submit Anyway</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
