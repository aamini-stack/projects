'use client';

import { Button } from '@/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/primitives/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/primitives/form';
import { Textarea } from '@/components/primitives/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  message: z.string().nonempty(),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactCard() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: values.message }),
      });

      if (!response.ok) {
        toast.error(response.statusText);
      } else {
        toast.success('Message sent successfully!');
        form.reset();
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Reach out!</CardTitle>
        <CardDescription>
          Either email me at{' '}
          <a
            className="text-cyan-600 hover:underline"
            href="mailto:aamini1024@gmail.com"
          >
            aamini1024@gmail.com
          </a>{' '}
          or fill out the form below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="email" onSubmit={() => form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your message..."
                      className="h-40 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          form="email"
          type="submit"
          className="w-40"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
          <Image
            src="/icons/email.svg"
            alt="Email Icon"
            width={16}
            height={16}
            className="ml-2"
          />
        </Button>
      </CardFooter>
    </Card>
  );
}
