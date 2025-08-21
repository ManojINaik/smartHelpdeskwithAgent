import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTicketsStore } from '../store/tickets';

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
  attachmentUrls: z.array(z.string().url()).max(10).optional(),
});

type FormValues = z.infer<typeof schema>;

export const CreateTicketForm: React.FC = () => {
  const { createTicket } = useTicketsStore();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await createTicket(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-6 space-y-4">
      <div>
        <label className="form-label">Title</label>
        <input className="form-input" {...register('title')} />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea className="form-textarea" rows={4} {...register('description')} />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>
      <div>
        <label className="form-label">Category</label>
        <select className="form-select" {...register('category')}>
          <option value="other">Other</option>
          <option value="billing">Billing</option>
          <option value="tech">Tech</option>
          <option value="shipping">Shipping</option>
        </select>
      </div>
      <div>
        <label className="form-label">Attachment URLs (comma separated)</label>
        <input className="form-input" placeholder="https://...,. . ." {...register('attachmentUrls', {
          setValueAs: (v: unknown) => typeof v === 'string' ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : v
        } as any)} />
        {errors.attachmentUrls && <p className="text-sm text-red-600">Invalid URLs</p>}
      </div>
      <div className="flex items-center gap-3">
        <button disabled={isSubmitting} className="btn btn-primary">Create Ticket</button>
        <button type="button" className="btn btn-ghost" onClick={() => reset()}>Reset</button>
      </div>
    </form>
  );
};

export default CreateTicketForm;


