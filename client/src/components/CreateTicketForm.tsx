import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTicketsStore } from '../store/tickets';
import useTickets from '../hooks/useTickets';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ModernCard } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Paperclip, CreditCard } from 'lucide-react';

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
  attachmentUrls: z.array(z.string().url()).max(10).optional(),
});

type FormValues = z.infer<typeof schema>;

export const CreateTicketForm: React.FC = () => {
  const { createTicket } = useTicketsStore();
  const { refresh } = useTickets(false); // Don't auto-fetch, we'll refresh manually
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [category, setCategory] = useState<string>('other');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const payload = {
        ...data,
        category: category as any
      };
      
      await createTicket(payload);
      
      // Refresh the tickets list to show the new ticket
      refresh();
      
      setSuccessMessage('Ticket created successfully!');
      reset();
      setCategory('other');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to create ticket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert className="border-success-500 bg-success-50 rounded-2xl">
          <CheckCircle className="h-5 w-5 text-success-500" />
          <AlertDescription className="text-success-700 font-mulish font-semibold">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert className="border-red-500 bg-red-50 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-700 font-mulish font-semibold">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Payment-Inspired Form Card */}
      <ModernCard variant="payment">
        <div className="mb-6">
          <h3 className="text-2xl font-mulish font-bold text-neutral-900 mb-2">
            Create New Ticket
          </h3>
          <p className="text-sm font-mulish font-medium text-neutral-400">
            Describe your issue and we'll help you resolve it
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label 
              htmlFor="title" 
              variant="modern" 
              className="text-neutral-400"
            >
              Ticket Title
            </Label>
            <div className="relative">
              <Input
                id="title"
                variant="modern"
                placeholder="Brief description of your issue"
                {...register('title')}
                className={`font-mulish font-bold tracking-widest ${
                  errors.title ? 'border-red-500 focus-visible:border-red-500' : 'border-primary-500'
                }`}
              />
              {!errors.title && (
                <div className="absolute right-4 top-4">
                  <CreditCard className="w-5 h-5 text-primary-400" />
                </div>
              )}
            </div>
            {errors.title && (
              <p className="text-sm font-mulish font-semibold text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Category and Priority Row */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label variant="modern" className="text-neutral-400">
                Category
              </Label>
              <div className="h-15 rounded-lg border-2 border-neutral-200 bg-background flex items-center px-5">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-0 p-0 h-auto font-mulish font-bold text-primary-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="other">General</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="tech">Technical</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <Label variant="modern" className="text-neutral-400">
                Priority
              </Label>
              <div className="h-15 rounded-lg border-2 border-neutral-200 bg-background flex items-center px-5">
                <Badge variant="accent" size="sm">
                  NORMAL
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label variant="modern" className="text-neutral-400">
              Description
            </Label>
            <Textarea
              variant="modern"
              placeholder="Please provide detailed information about your issue..."
              rows={5}
              {...register('description')}
              className={`font-mulish font-medium resize-none ${
                errors.description ? 'border-red-500 focus-visible:border-red-500' : ''
              }`}
            />
            {errors.description && (
              <p className="text-sm font-mulish font-semibold text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Attachment URLs */}
          <div className="space-y-2">
            <Label variant="modern" className="text-neutral-400">
              Attachments (Optional)
            </Label>
            <div className="relative">
              <Input
                variant="modern"
                placeholder="https://example.com/file.pdf"
                {...register('attachmentUrls', {
                  setValueAs: (v: unknown) => 
                    typeof v === 'string' 
                      ? v.split(',').map((s: string) => s.trim()).filter(Boolean) 
                      : v
                } as any)}
                className={`font-mulish font-medium ${
                  errors.attachmentUrls ? 'border-red-500 focus-visible:border-red-500' : ''
                }`}
              />
              <div className="absolute right-4 top-4">
                <Paperclip className="w-5 h-5 text-neutral-400" />
              </div>
            </div>
            {errors.attachmentUrls && (
              <p className="text-sm font-mulish font-semibold text-red-600">
                Please provide valid URLs
              </p>
            )}
            <p className="text-xs font-mulish font-medium text-neutral-400">
              Separate multiple URLs with commas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="secondary"
              size="lg"
              onClick={() => {
                reset();
                setCategory('other');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={isSubmitting}
              className="font-mulish font-bold"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              size="lg"
              disabled={isSubmitting}
              className="font-mulish font-bold min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </div>
        </form>
      </ModernCard>
    </div>
  );
};

export default CreateTicketForm;


