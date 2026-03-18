'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  SendIcon, 
  EditIcon, 
  CheckIcon, 
  XIcon,
  LanguagesIcon,
  ArrowRightIcon
} from 'lucide-react';

interface CommanderCardProps {
  originalMessage: string;
  translatedCommand: {
    action_verb: string;
    target_component: string;
    specifications: string[];
    expected_outcome: string;
    description: string;
  } | null;
  isLoading?: boolean;
  onSendToProject: (projectId: string) => void;
  onEdit: (newTranslation: string) => void;
  onRetranslate: () => void;
}

export function CommanderCard({
  originalMessage,
  translatedCommand,
  isLoading = false,
  onSendToProject,
  onEdit,
  onRetranslate
}: CommanderCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    translatedCommand?.description || ''
  );
  const [selectedProject, setSelectedProject] = useState<string>('');

  const handleSaveEdit = () => {
    onEdit(editedDescription);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedDescription(translatedCommand?.description || '');
    setIsEditing(false);
  };

  const handleSendToProject = () => {
    if (selectedProject) {
      onSendToProject(selectedProject);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center gap-2">
          <LanguagesIcon className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-blue-800">
            Command Translation
          </CardTitle>
          <Badge variant="outline" className="ml-auto text-xs">
            AR → EN
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Original Arabic Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Original Message (Arabic)
          </label>
          <div className="p-3 bg-gray-50 rounded-lg border text-right">
            <p className="text-gray-800 font-arabic leading-relaxed">
              {originalMessage}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Translating command...</span>
          </div>
        )}

        {/* Translated Command */}
        {translatedCommand && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ArrowRightIcon className="h-4 w-4 text-green-600" />
              <label className="text-sm font-medium text-gray-700">
                Translated Command (English)
              </label>
            </div>

            {/* Command Structure */}
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Action
                  </label>
                  <Badge variant="secondary" className="mt-1">
                    {translatedCommand.action_verb}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Target
                  </label>
                  <Badge variant="outline" className="mt-1">
                    {translatedCommand.target_component}
                  </Badge>
                </div>
              </div>

              {/* Specifications */}
              {translatedCommand.specifications.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Specifications
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {translatedCommand.specifications.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected Outcome */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Expected Outcome
                </label>
                <p className="text-sm text-gray-700 mt-1 p-2 bg-green-50 rounded border-l-3 border-green-400">
                  {translatedCommand.expected_outcome}
                </p>
              </div>
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Full Description
              </label>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                    placeholder="Edit the translated command..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <XIcon className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-gray-800 leading-relaxed">
                      {translatedCommand.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <div className="flex-1">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select Project</option>
                  <option value="genplatform">GenPlatform.ai</option>
                  <option value="main-dashboard">Main Dashboard</option>
                  <option value="ideas-lab">Ideas Lab</option>
                </select>
              </div>
              
              <Button
                onClick={handleSendToProject}
                disabled={!selectedProject}
                className="flex items-center gap-2"
              >
                <SendIcon className="h-4 w-4" />
                Send to Project
              </Button>
              
              <Button
                onClick={onRetranslate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LanguagesIcon className="h-4 w-4" />
                Retranslate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}