import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, CheckCircle2 } from "lucide-react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n/I18nProvider";

export default function Feedback() {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | undefined>(undefined);

  const mutation = useMutation({
    mutationFn: () => api.submitFeedback({ message, rating, page: "feedback" }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  if (mutation.isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <CheckCircle2 className="mx-auto text-success" size={40} aria-hidden="true" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{t("feedback.thankYou")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("feedback.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("feedback.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="feedback-message" className="mb-1 block text-sm font-semibold text-ink">
            {t("feedback.messageLabel")}
          </label>
          <textarea
            id="feedback-message"
            className="field min-h-[140px] resize-y"
            placeholder={t("feedback.messagePlaceholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">{t("feedback.ratingLabel")}</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-pressed={rating === value}
                className={`h-10 w-10 rounded-full border font-semibold transition-colors ${
                  rating === value
                    ? "border-secondary bg-secondary text-white"
                    : "border-border text-ink-muted hover:border-secondary"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        {mutation.isError && <p className="text-sm text-danger">{t("feedback.errorBody")}</p>}

        <button type="submit" disabled={!message.trim() || mutation.isPending} className="btn-primary">
          <Send size={16} aria-hidden="true" />
          {mutation.isPending ? t("feedback.submitting") : t("feedback.submitBtn")}
        </button>
      </form>
    </div>
  );
}
