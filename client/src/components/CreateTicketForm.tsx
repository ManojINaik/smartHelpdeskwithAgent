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
import { CheckCircle, AlertCircle } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Brief description of your issue"
            {...register('title')}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Please provide detailed information about your issue..."
            rows={4}
            {...register('description')}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="tech">Technical</SelectItem>
              <SelectItem value="shipping">Shipping</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Attachment URLs */}
        <div className="space-y-2">
          <Label htmlFor="attachmentUrls">Attachment URLs (optional)</Label>
          <Input
            id="attachmentUrls"
            placeholder="https://example.com/file1.pdf, https://example.com/file2.jpg"
            {...register('attachmentUrls', {
              setValueAs: (v: unknown) => 
                typeof v === 'string' 
                  ? v.split(',').map((s: string) => s.trim()).filter(Boolean) 
                  : v
            } as any)}
            className={errors.attachmentUrls ? 'border-red-500' : ''}
          />
          {errors.attachmentUrls && (
            <p className="text-sm text-red-600">Please provide valid URLs</p>
          )}
          <p className="text-xs text-gray-500">
            Separate multiple URLs with commas
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              reset();
              setCategory('other');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            disabled={isSubmitting}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicketForm;


