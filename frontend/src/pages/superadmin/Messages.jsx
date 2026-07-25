import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Inbox, MessageSquareWarning, Send, Mail, CheckCircle2 } from 'lucide-react';
import complaintService from '../../services/complaintService';
import contactService from '../../services/contactService';
import usePolling from '../../hooks/usePolling';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

const TYPE_BADGE = {
  COMPLAINT: { tone: 'danger', label: 'Complaint' },
  HELP:      { tone: 'brand',  label: 'Help Request' },
};

const STATUS_BADGE = {
  OPEN:        { tone: 'warning', label: 'Open' },
  IN_PROGRESS: { tone: 'accent',  label: 'In Progress' },
  RESOLVED:    { tone: 'success', label: 'Resolved' },
};

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const ENQUIRY_LABEL = {
  GENERAL:     'General Enquiry',
  DEMO:        'Request a Demo',
  PRICING:     'Pricing & Plans',
  SUPPORT:     'Technical Support',
  PARTNERSHIP: 'Partnership',
};

const INQUIRY_STATUS_BADGE = {
  NEW:      { tone: 'warning', label: 'New' },
  REVIEWED: { tone: 'success', label: 'Reviewed' },
};

const POLL_MS = 8000;

export default function Messages() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('messages');

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState({ status: 'OPEN', reply: '' });
  const [saving, setSaving] = useState(false);

  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [markingReviewed, setMarkingReviewed] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const data = await complaintService.list({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setMessages(data);
    } catch {
      // silent on background polls; first-load failure surfaces via loading below
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  const loadInquiries = useCallback(async () => {
    try {
      const data = await contactService.list();
      setInquiries(data);
    } catch {
      // silent on background polls
    } finally {
      setInquiriesLoading(false);
    }
  }, []);

  // usePolling's own "run immediately" effect only re-fires when its
  // paused/interval args change, not when the filters do — so an explicit
  // reload here gives instant feedback on filter changes, on top of the
  // periodic background refresh below (which always reads the latest
  // filters via usePolling's callback ref).
  useEffect(() => {
    async function run() {
      setLoading(true);
      await loadMessages();
    }
    run();
  }, [loadMessages]);

  // Live refresh so newly submitted complaints/help requests and website
  // inquiries show up without a manual reload. Paused while a modal is open
  // so an in-progress reply/review isn't yanked out from under the admin.
  usePolling(loadMessages, POLL_MS, Boolean(selected));
  usePolling(loadInquiries, POLL_MS, Boolean(selectedInquiry));

  function openMessage(m) {
    setSelected(m);
    setDraft({ status: m.status, reply: m.reply || '' });
  }

  async function handleRespond() {
    setSaving(true);
    try {
      await complaintService.respond(selected.id, draft);
      toast.success('Response sent.');
      setSelected(null);
      loadMessages();
    } catch {
      toast.error('Failed to send response.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkReviewed() {
    setMarkingReviewed(true);
    try {
      await contactService.markStatus(selectedInquiry.id, 'REVIEWED');
      toast.success('Marked as reviewed.');
      setSelectedInquiry(null);
      loadInquiries();
    } catch {
      toast.error('Failed to update inquiry.');
    } finally {
      setMarkingReviewed(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Complaints & Help" subtitle="Help requests, complaints and website inquiries from across all institutions" />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        layoutId="messages-tabs"
        items={[
          { value: 'messages', label: 'Complaints & Help', icon: Inbox },
          { value: 'inquiries', label: 'Website Inquiries', icon: Mail },
        ]}
        className="mb-5"
      />

      {activeTab === 'messages' && (
      <>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-ink/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-ink/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">All types</option>
          <option value="COMPLAINT">Complaint</option>
          <option value="HELP">Help Request</option>
        </select>

        <span className="text-xs text-ink-faint ml-auto">{messages.length} messages</span>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : messages.length === 0 ? (
        <Card padding="p-0">
          <EmptyState icon={Inbox} title="No messages" message="Nothing matches these filters yet." />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {messages.map((m, i) => {
            const typeBadge = TYPE_BADGE[m.type] ?? TYPE_BADGE.HELP;
            const statusBadge = STATUS_BADGE[m.status] ?? STATUS_BADGE.OPEN;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
              >
                <Card
                  hover
                  className="cursor-pointer"
                  onClick={() => openMessage(m)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-ink truncate">{m.subject}</p>
                        <Badge tone={typeBadge.tone}>{typeBadge.label}</Badge>
                      </div>
                      <p className="text-xs text-ink-faint truncate">
                        {m.submitted_by.username} ({m.submitted_by.role}) · {m.submitted_by.email}
                      </p>
                      <p className="text-sm text-ink-soft mt-2 line-clamp-2">{m.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
                      <span className="text-[11px] text-ink-faint whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.subject}
        footer={
          <>
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-ink-soft border border-ink/10 hover:bg-ink/[0.03] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRespond}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" /> {saving ? 'Sending…' : 'Send response'}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={(TYPE_BADGE[selected.type] ?? TYPE_BADGE.HELP).tone}>
                {(TYPE_BADGE[selected.type] ?? TYPE_BADGE.HELP).label}
              </Badge>
              <span className="text-xs text-ink-faint">
                From {selected.submitted_by.username} ({selected.submitted_by.role}) · {selected.submitted_by.email}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-paper-soft border border-ink/[0.06]">
              <p className="text-sm text-ink-soft whitespace-pre-wrap flex items-start gap-2">
                <MessageSquareWarning className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                {selected.message}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-faint block mb-1.5">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                className="w-full sm:w-56 px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-faint block mb-1.5">Reply</label>
              <textarea
                value={draft.reply}
                onChange={(e) => setDraft((d) => ({ ...d, reply: e.target.value }))}
                placeholder="Write a response to this user…"
                rows={5}
                className="w-full px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
      </>
      )}

      {activeTab === 'inquiries' && (
      <>
      <div className="flex items-center mb-5">
        <span className="text-xs text-ink-faint ml-auto">{inquiries.length} inquiries</span>
      </div>

      {inquiriesLoading ? (
        <SkeletonRows rows={5} />
      ) : inquiries.length === 0 ? (
        <Card padding="p-0">
          <EmptyState icon={Mail} title="No website inquiries" message="Messages submitted through the landing page's contact form will show up here." />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {inquiries.map((inq, i) => {
            const statusBadge = INQUIRY_STATUS_BADGE[inq.status] ?? INQUIRY_STATUS_BADGE.NEW;
            return (
              <motion.div
                key={inq.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
              >
                <Card
                  hover
                  className="cursor-pointer"
                  onClick={() => setSelectedInquiry(inq)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-ink truncate">
                          {inq.first_name} {inq.last_name}
                        </p>
                        <Badge tone="brand">{ENQUIRY_LABEL[inq.enquiry_type] ?? inq.enquiry_type}</Badge>
                      </div>
                      <p className="text-xs text-ink-faint truncate">
                        {inq.email}{inq.institution_name ? ` · ${inq.institution_name}` : ''}
                      </p>
                      <p className="text-sm text-ink-soft mt-2 line-clamp-2">{inq.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
                      <span className="text-[11px] text-ink-faint whitespace-nowrap">
                        {new Date(inq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        title={selectedInquiry ? `${selectedInquiry.first_name} ${selectedInquiry.last_name}` : ''}
        footer={
          <>
            <button
              onClick={() => setSelectedInquiry(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-ink-soft border border-ink/10 hover:bg-ink/[0.03] transition-colors"
            >
              Close
            </button>
            {selectedInquiry?.status !== 'REVIEWED' && (
              <button
                onClick={handleMarkReviewed}
                disabled={markingReviewed}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" /> {markingReviewed ? 'Saving…' : 'Mark as reviewed'}
              </button>
            )}
          </>
        }
      >
        {selectedInquiry && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="brand">{ENQUIRY_LABEL[selectedInquiry.enquiry_type] ?? selectedInquiry.enquiry_type}</Badge>
              <span className="text-xs text-ink-faint">
                {selectedInquiry.email}{selectedInquiry.institution_name ? ` · ${selectedInquiry.institution_name}` : ''}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-paper-soft border border-ink/[0.06]">
              <p className="text-sm text-ink-soft whitespace-pre-wrap flex items-start gap-2">
                <Mail className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                {selectedInquiry.message}
              </p>
            </div>
          </div>
        )}
      </Modal>
      </>
      )}
    </div>
  );
}
