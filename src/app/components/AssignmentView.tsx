import React, { useState } from 'react';
import { useAuth, type Homework } from '@/app/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Calendar, Clock, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AssignmentView: React.FC<{ courseId?: string }> = ({ courseId }) => {
  const { user, homeworks, homeworkSubmissions, submitHomework } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState<Homework | null>(null);
  const [submissionText, setSubmissionText] = useState('');

  if (!user) return null;

  const myAssignments = homeworks.filter(hw => courseId ? hw.courseId === courseId : user.courses.includes(hw.courseId));
  const getMySubmission = (homeworkId: string) =>
    homeworkSubmissions.find(sub => sub.homeworkId === homeworkId && sub.studentId === user.id);

  const pendingAssignments = myAssignments.filter(hw => !getMySubmission(hw.id) && !(new Date(hw.dueDate) < new Date()));
  const submittedAssignments = myAssignments.filter(hw => !!getMySubmission(hw.id));
  const overdueAssignments = myAssignments.filter(hw => !getMySubmission(hw.id) && new Date(hw.dueDate) < new Date());

  const handleSubmit = () => {
    if (!selectedAssignment || !submissionText.trim()) return;
    submitHomework({ homeworkId: selectedAssignment.id, studentId: user.id, studentName: user.name, content: submissionText });
    toast.success('Assignment submitted successfully!');
    setSubmissionText('');
    setSelectedAssignment(null);
  };

  const getDaysUntilDue = (dueDate: string) =>
    Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const renderAssignmentCard = (assignment: Homework, showSubmitButton: boolean = true) => {
    const mySubmission = getMySubmission(assignment.id);
    const daysUntilDue = getDaysUntilDue(assignment.dueDate);

    return (
      <Card key={assignment.id} className="hover:shadow-lg transition">
        <CardHeader>
          <Badge variant="outline" className="mb-2">{assignment.courseName}</Badge>
          <CardTitle className="text-lg">{assignment.title}</CardTitle>
          <CardDescription className="mt-2">{assignment.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-stone-600">
                <Calendar className="w-4 h-4" />
                <div><div className="font-medium">Assigned</div><div>{new Date(assignment.assignedDate).toLocaleDateString()}</div></div>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Clock className="w-4 h-4" />
                <div>
                  <div className="font-medium">Due Date</div>
                  <div className={daysUntilDue < 0 ? 'text-red-600 font-bold' : daysUntilDue <= 2 ? 'text-yellow-600 font-medium' : ''}>
                    {new Date(assignment.dueDate).toLocaleDateString()}
                    {daysUntilDue >= 0 && ` (${daysUntilDue} days left)`}
                  </div>
                </div>
              </div>
            </div>

            {mySubmission && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Submitted</span>
                </div>
                <p className="text-xs text-stone-600">Submitted on: {new Date(mySubmission.submittedAt).toLocaleString()}</p>
                {mySubmission.grade !== undefined && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Grade:</span>
                      <Badge className="bg-green-600">{mySubmission.grade}%</Badge>
                    </div>
                    {mySubmission.feedback && (
                      <p className="text-xs text-stone-600 mt-2"><strong>Feedback:</strong> {mySubmission.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {showSubmitButton && !mySubmission && (
              <Button onClick={() => setSelectedAssignment(assignment)} className="w-full">
                <Upload className="w-4 h-4 mr-2" /> Submit Assignment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const empty = (icon: React.ReactNode, text: string) => (
    <Card><CardContent className="py-12 text-center text-stone-500">{icon}<p>{text}</p></CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-2" />Pending ({pendingAssignments.length})</TabsTrigger>
          <TabsTrigger value="submitted"><CheckCircle2 className="w-4 h-4 mr-2" />Submitted ({submittedAssignments.length})</TabsTrigger>
          <TabsTrigger value="overdue"><AlertCircle className="w-4 h-4 mr-2" />Overdue ({overdueAssignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAssignments.length === 0
            ? empty(<FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />, 'No pending assignments')
            : <div className="grid md:grid-cols-2 gap-4">{pendingAssignments.map(hw => renderAssignmentCard(hw))}</div>}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedAssignments.length === 0
            ? empty(<FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />, 'No submitted assignments yet')
            : <div className="grid md:grid-cols-2 gap-4">{submittedAssignments.map(hw => renderAssignmentCard(hw, false))}</div>}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueAssignments.length === 0
            ? empty(<CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50 text-green-600" />, 'Great! No overdue assignments')
            : (
              <div className="grid md:grid-cols-2 gap-4">
                {overdueAssignments.map(hw => (
                  <div key={hw.id} className="relative">
                    <div className="absolute top-3 right-3 z-10"><Badge className="bg-red-600">OVERDUE</Badge></div>
                    {renderAssignmentCard(hw, false)}
                  </div>
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>

      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Submit Assignment</CardTitle>
              <CardDescription>{selectedAssignment.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Assignment Instructions:</h4>
                <p className="text-sm text-stone-700">{selectedAssignment.description}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-stone-600">
                  <span>Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                  <Badge variant="outline">{selectedAssignment.courseName}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Your Submission:</label>
                <Textarea value={submissionText} onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your assignment submission here or paste your code/answers..." rows={12} className="font-mono text-sm" />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSubmit} className="flex-1" disabled={!submissionText.trim()}>
                  <Upload className="w-4 h-4 mr-2" /> Submit Assignment
                </Button>
                <Button variant="outline" onClick={() => { setSelectedAssignment(null); setSubmissionText(''); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
