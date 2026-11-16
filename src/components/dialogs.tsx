"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";

/*
  In-app replacements for window.confirm and window.prompt.

  The browser versions freeze the whole page until the person answers, which
  shows up as a very slow click (INP) and looks out of place on a phone.
  These return a promise instead, so the call sites stay as short:

    if (await confirmDialog({ title: "Delete this item?" })) ...
    const name = await promptDialog({ title: "Category name" });

  <Feedback /> must be on the page for them to appear.
*/

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Red confirm button, for deleting or hiding things. */
  destructive?: boolean;
};

type PromptOptions = {
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "email" | "date" | "tel";
  /** Earliest allowed date (YYYY-MM-DD), for type "date". */
  min?: string;
  maxLength?: number;
  confirmLabel?: string;
  /** Returns a message to show under the field when the value is not acceptable. */
  validate?: (value: string) => string | null;
};

type Request =
  | ({ kind: "confirm"; resolve: (ok: boolean) => void } & ConfirmOptions)
  | ({ kind: "prompt"; resolve: (value: string | null) => void } & PromptOptions);

let show: ((request: Request) => void) | null = null;

/** Asks a yes/no question. Resolves to false if the person cancels. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!show) return resolve(false);
    show({ kind: "confirm", resolve, ...options });
  });
}

/** Asks for one value. Resolves to null if the person cancels or leaves it empty. */
export function promptDialog(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    if (!show) return resolve(null);
    show({ kind: "prompt", resolve, ...options });
  });
}

function DialogHost() {
  const [request, setRequest] = useState<Request | null>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [invalid, setInvalid] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Guards against answering twice (e.g. submit followed by the close callback).
  const answered = useRef(true);

  useEffect(() => {
    show = (next) => {
      answered.current = false;
      setRequest(next);
      setInvalid(null);
      setCount((n) => n + 1);
      setOpen(true);
    };
    return () => {
      show = null;
    };
  }, []);

  const answer = (value: string | boolean | null) => {
    if (!request || answered.current) return;
    answered.current = true;
    setOpen(false);
    if (request.kind === "confirm") request.resolve(value === true);
    else request.resolve(typeof value === "string" ? value : null);
  };

  if (!request) return null;

  const cancel = () => answer(request.kind === "confirm" ? false : null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && cancel()}>
      <DialogContent
        key={count}
        showCloseButton={false}
        className="text-base"
        initialFocus={request.kind === "prompt" ? inputRef : undefined}
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (request.kind === "confirm") return answer(true);
            const value = inputRef.current?.value.trim() ?? "";
            if (!value) return;
            const problem = request.validate?.(value) ?? null;
            setInvalid(problem);
            if (problem) inputRef.current?.focus();
            else answer(value);
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug font-bold">{request.title}</DialogTitle>
            {request.description && <DialogDescription>{request.description}</DialogDescription>}
          </DialogHeader>

          {request.kind === "prompt" && (
            <div>
              {request.label && <Label htmlFor="prompt-dialog-input">{request.label}</Label>}
              <Input
                ref={inputRef}
                id="prompt-dialog-input"
                aria-label={request.label ? undefined : request.title}
                type={request.type ?? "text"}
                defaultValue={request.defaultValue}
                placeholder={request.placeholder}
                min={request.min}
                maxLength={request.maxLength}
                inputMode={request.type === "tel" ? "numeric" : undefined}
                autoComplete="off"
                aria-invalid={invalid ? true : undefined}
                aria-describedby={invalid ? "prompt-dialog-error" : undefined}
                onChange={() => invalid && setInvalid(null)}
                required
              />
              {invalid && (
                <p id="prompt-dialog-error" role="alert" className="mt-1.5 text-sm text-destructive">
                  {invalid}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={cancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={request.kind === "confirm" && request.destructive ? "destructive" : "default"}
            >
              {request.confirmLabel ?? (request.kind === "confirm" ? "Yes" : "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Toasts and dialogs for the logged-in pages. Render once per layout. */
export function Feedback() {
  return (
    <>
      <Toaster />
      <DialogHost />
    </>
  );
}
