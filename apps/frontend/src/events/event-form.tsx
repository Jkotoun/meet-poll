'use client';

import Button from '@mui/material/Button';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { browserApi } from '@/api/browser-client';
import { unwrap } from '@/api/problem';
import { FormField, required, SubmitForm, submitToServer } from '@/forms/form';
import { type SlotRow, toSlot } from './slots';

// Mirrors the backend's limit.
const MAX_SLOTS = 50;

interface EventValues {
  title: string;
  slots: SlotRow[];
}

const emptyEvent: EventValues = {
  title: '',
  slots: [{ date: '', start: '', end: '' }],
};

const shrinkLabel = { inputLabel: { shrink: true } };

function endAfterStart(start: string, end: string): string | undefined {
  return (
    required('End')({ value: end }) ??
    (end > start ? undefined : 'End must be after start')
  );
}

export function EventForm() {
  const router = useRouter();
  const form = useForm({
    defaultValues: emptyEvent,
    validators: {
      onSubmitAsync: submitToServer<EventValues>(async ({ title, slots }) => {
        const event = unwrap(
          await browserApi.POST('/v1/events', {
            body: {
              title,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              slots: slots.map(toSlot),
            },
          }),
        );
        router.push(`/events/${event.slug}`);
      }),
    },
  });

  return (
    <SubmitForm form={form} submitLabel="Create event">
      <form.Field name="title" validators={{ onSubmit: required('Title') }}>
        {(field) => <FormField field={field} label="Title" />}
      </form.Field>
      <form.Field name="slots" mode="array">
        {(slots) => (
          <>
            {slots.state.value.map((_, i) => (
              <fieldset
                key={i}
                aria-label={`Slot ${i + 1}`}
                className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <form.Field
                  name={`slots[${i}].date`}
                  validators={{ onSubmit: required('Date') }}
                >
                  {(field) => (
                    <FormField
                      field={field}
                      label="Date"
                      type="date"
                      slotProps={shrinkLabel}
                    />
                  )}
                </form.Field>
                <form.Field
                  name={`slots[${i}].start`}
                  validators={{ onSubmit: required('Start') }}
                >
                  {(field) => (
                    <FormField
                      field={field}
                      label="Start"
                      type="time"
                      slotProps={shrinkLabel}
                    />
                  )}
                </form.Field>
                <form.Field
                  name={`slots[${i}].end`}
                  validators={{
                    onSubmit: ({ value, fieldApi }) =>
                      endAfterStart(
                        fieldApi.form.getFieldValue(`slots[${i}].start`),
                        value,
                      ),
                  }}
                >
                  {(field) => (
                    <FormField
                      field={field}
                      label="End"
                      type="time"
                      slotProps={shrinkLabel}
                    />
                  )}
                </form.Field>
                <Button
                  disabled={slots.state.value.length === 1}
                  onClick={() => slots.removeValue(i)}
                >
                  Remove
                </Button>
              </fieldset>
            ))}
            <Button
              className="self-start"
              disabled={slots.state.value.length >= MAX_SLOTS}
              // A copy of the last row, since slots often share a day or a time.
              onClick={() => slots.pushValue({ ...slots.state.value.at(-1)! })}
            >
              Add slot
            </Button>
          </>
        )}
      </form.Field>
    </SubmitForm>
  );
}
