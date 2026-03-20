'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, Loader2 } from 'lucide-react';

interface RewriteApproveProps {
  fileId: string;
  messageNumber: number;
  onRewrite: () => Promise<void>;
  onApprove: () => Promise<void>;
  onRefresh: () => void;
  disabled?: boolean;
}

export function RewriteApprove({
  fileId,
  messageNumber,
  onRewrite,
  onApprove,
  onRefresh,
  disabled = false
}: RewriteApproveProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleRewrite = async () => {
    setIsRewriting(true);
    try {
      await onRewrite();
      onRefresh();
    } catch (error) {
      console.error('Rewrite error:', error);
      alert('Failed to rewrite tasks');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
      onRefresh();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve tasks');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleRewrite}
        disabled={disabled || isRewriting || isApproving}
        className="h-6 px-2 text-[11px] font-medium"
      >
        {isRewriting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-0.5" />
            Rewrite
          </>
        )}
      </Button>
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={disabled || isRewriting || isApproving}
        className="h-6 px-2 text-[11px] bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        {isApproving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <Check className="h-3 w-3 mr-0.5" />
            OK
          </>
        )}
      </Button>
    </div>
  );
}