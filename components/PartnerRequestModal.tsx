'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^\d+$/, 'Phone must contain only numbers'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(2, 'Company name is required'),
  companyWebsite: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function PartnerRequestModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/partner-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

      toast.success('Request submitted successfully! We will contact you soon.');
      reset();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-black border border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Partner Request</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Fill in the details below to start your partnership journey with ZenZebra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-neutral-300">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-[#CC2224]"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-neutral-300">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="9876543210"
                {...register('phone')}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-[#CC2224]"
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-300">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              {...register('email')}
              className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-[#CC2224]"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-neutral-300">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="Acme Corp"
              {...register('companyName')}
              className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-[#CC2224]"
            />
            {errors.companyName && (
              <p className="text-xs text-red-500">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite" className="text-neutral-300">
              Company Website
            </Label>
            <Input
              id="companyWebsite"
              placeholder="https://acme.com"
              {...register('companyWebsite')}
              className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-[#CC2224]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-neutral-300">
              Remarks
            </Label>
            <Textarea
              id="remarks"
              placeholder="Tell us more about your request..."
              {...register('remarks')}
              className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-[#CC2224] resize-none"
              rows={3}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-neutral-800 bg-transparent text-white hover:bg-neutral-900 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#CC2224] hover:bg-[#b31d1f] text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
