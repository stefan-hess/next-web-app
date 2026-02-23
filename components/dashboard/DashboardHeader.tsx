
import { Bell, Bot, MessageSquare, RefreshCw, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "app/lib/supabaseClient";
import { useQuarterlyReportNotifications } from "app/lib/useQuarterlyReportNotifications";
import { Button } from "components/ui/Button/Button_new";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";


  // ...existing code...

interface DashboardHeaderProps {
  ticker?: { symbol: string; name: string };
  marketCap?: string;
  marketCapCurrency?: string;
  onOpenAssistant?: () => void;
  onRefreshData?: () => void;
  selectedTickers?: { symbol: string; name: string }[];
  showAssistantButton?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ selectedTickers = [], onOpenAssistant, showAssistantButton, onRefreshData }) => {
  // Scaling logic
  // ...existing code...
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Quarterly report notifications hook
  const { newReports, loading: reportsLoading, markAsRead } = useQuarterlyReportNotifications(
    userEmail,
    selectedTickers.map(t => t.symbol)
  );

  // Fetch user email on mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    fetchUserEmail();
  }, []);
  async function handleSubmitFeedback() {
    if (!feedbackText.trim()) return;
    setFeedbackLoading(true);
    setFeedbackStatus(null);
    try {
      const { error } = await supabase
        .from("feedback")
        .insert([{ feedback: feedbackText.trim(), email: userEmail || null }]);
      if (error) {
        setFeedbackStatus({ type: "error", message: "Failed to submit feedback. Please try again." });
      } else {
        setFeedbackStatus({ type: "success", message: "Thank you for your feedback!" });
        setFeedbackText("");
      }
    } catch {
      setFeedbackStatus({ type: "error", message: "Failed to submit feedback. Please try again." });
    } finally {
      setFeedbackLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!userEmail) {
      setResetStatus({ type: "error", message: "Could not retrieve your email address. Please refresh and try again." });
      return;
    }
    setResetLoading(true);
    setResetStatus(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) {
        setResetStatus({ type: "error", message: "Password reset failed. Please contact info@usenektaar.com for assistance." });
      } else {
        setResetStatus({ type: "success", message: "Reset email sent. Please check your inbox." });
      }
    } catch {
      setResetStatus({ type: "error", message: "Password reset failed. Please contact info@usenektaar.com for assistance." });
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore AuthSessionMissingError and always redirect
      if (
        typeof e === "object" &&
        e &&
        "name" in e &&
        (e as { name?: string }).name !== "AuthSessionMissingError"
      ) {
        console.error("Logout error:", e);
      }
    }
    window.location.href = "/"; // Redirect to landing page
  }
  return (
    <>
      <div className="block md:hidden w-full bg-yellow-100 text-yellow-900 text-center py-2 px-4 text-sm font-medium border-b border-yellow-300">
        You are currently using the mobile view, for enhanced experience, please use the desktop version.
      </div>
      <header className="sticky top-0 z-30 h-16 bg-[#fdf6ee] border-b border-border flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
            <Image
              src="/assets/icon/icon_v1.svg"
              width={36}
              height={36}
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-financial-primary"
              alt="Nektaar logo"
            />
            <h1 className="text-lg font-medium text-foreground">
              Nektaar
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Minimal Refresh Widget */}
        {onRefreshData && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onRefreshData}
            aria-label="Refresh Data"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {/* Feedback Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => { setFeedbackOpen(true); setFeedbackStatus(null); }}
          aria-label="Send Feedback"
          title="Send Feedback"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">Feedback</span>
        </Button>
        {showAssistantButton && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onOpenAssistant}
            aria-label="Open AI Assistant"
            title="AI Assistant"
          >
            <Bot className="h-4 w-4" />
            AI Assistant
          </Button>
        )}
        <div className="h-4 w-px bg-border mx-2" />
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 relative" 
            onClick={() => setNotificationOpen((open) => !open)}
          >
            <Bell className="h-4 w-4" />
            {newReports.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {newReports.length}
              </span>
            )}
          </Button>
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded shadow-lg z-50 p-4 max-h-[500px] overflow-y-auto" style={{ backgroundColor: '#fdf6ee' }}>
              <h3 className="font-semibold text-sm mb-3">Notifications</h3>
              
              {reportsLoading && (
                <div className="text-xs text-muted-foreground mb-2">Loading quarterly reports…</div>
              )}
              
              {!reportsLoading && newReports.length === 0 && (
                <div className="text-muted-foreground text-sm py-4 text-center">
                  No new quarterly reports for your selected tickers.
                </div>
              )}
              
              {newReports.length > 0 && (
                <ul className="divide-y divide-border">
                  {newReports.map((report) => (
                    <li key={`${report.ticker}-${report.fiscalDateEnding}`} className="py-3 flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{report.ticker}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          New quarterly report for fiscal period ending{' '}
                          <span className="font-semibold">{report.fiscalDateEnding}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(report.ticker, report.fiscalDateEnding)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline flex-shrink-0"
                      >
                        Dismiss
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setDropdownOpen((open: boolean) => !open)}
            aria-label="User menu"
          >
            <User className="h-4 w-4" />
          </Button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded shadow-lg z-50" style={{ backgroundColor: '#fdf6ee' }}>
              <button
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted-foreground/10"
                onClick={() => { setDropdownOpen(false); setResetDialogOpen(true); }}
              >Reset Password</button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted-foreground/10"
                onClick={handleLogout}
              >Log Out</button>
            </div>
          )}
        </div>
      </div>
      </header>

      <Dialog open={feedbackOpen} onOpenChange={(open) => { setFeedbackOpen(open); if (!open) { setFeedbackStatus(null); setFeedbackText(""); } }}>
        <DialogContent style={{ backgroundColor: '#fff' }}>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Share your thoughts, suggestions, or issues. We&apos;ll receive it directly.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={5}
            placeholder="Write your feedback here…"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={feedbackLoading || feedbackStatus?.type === "success"}
          />
          {feedbackStatus && (
            <p className={`text-sm text-center ${feedbackStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {feedbackStatus.message}
            </p>
          )}
          <DialogFooter>
            <button
              className="px-4 py-2 text-sm rounded border border-border hover:bg-muted-foreground/10"
              onClick={() => { setFeedbackOpen(false); setFeedbackStatus(null); setFeedbackText(""); }}
            >Cancel</button>
            <button
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSubmitFeedback}
              disabled={feedbackLoading || !feedbackText.trim() || feedbackStatus?.type === "success"}
            >
              {feedbackLoading ? "Sending…" : "Submit"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={(open) => { setResetDialogOpen(open); if (!open) setResetStatus(null); }}>
        <DialogContent style={{ backgroundColor: '#fff' }}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              A password reset link will be sent to <strong>{userEmail}</strong>. Click confirm to proceed.
            </DialogDescription>
          </DialogHeader>
          {resetStatus && (
            <p className={`text-sm text-center ${resetStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {resetStatus.message}
            </p>
          )}
          <DialogFooter>
            <button
              className="px-4 py-2 text-sm rounded border border-border hover:bg-muted-foreground/10"
              onClick={() => { setResetDialogOpen(false); setResetStatus(null); }}
            >Cancel</button>
            <button
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleResetPassword}
              disabled={resetLoading || resetStatus?.type === "success"}
            >
              {resetLoading ? "Sending…" : "Send Reset Email"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};