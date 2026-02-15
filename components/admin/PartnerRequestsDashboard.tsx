'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Mail,
  Phone,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// --- Types ---
interface PartnerRequest {
  $id: string;
  $createdAt: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyWebsite?: string;
  remarks?: string;
  status: 'Queued' | 'contacted' | 'in_progress' | 'onboarded' | 'discarded' | 'spam';
}

export default function PartnerRequestsDashboard() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);

  // Fetch Data
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/partner-request/list');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.documents || []);
      } else {
        toast.error('Failed to load requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || req.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Handle Status Update
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      const oldRequests = [...requests];
      setRequests((prev) =>
        prev.map((req) => (req.$id === id ? { ...req, status: newStatus as any } : req)),
      );
      if (selectedRequest?.$id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }

      const response = await fetch('/api/admin/partner-request/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          // Pass extra fields for email notifications if needed
          email: selectedRequest?.email,
          name: selectedRequest?.name,
          companyName: selectedRequest?.companyName,
        }),
      });

      if (response.ok) {
        toast.success('Status updated successfully');
      } else {
        // Revert on failure
        setRequests(oldRequests);
        if (selectedRequest?.$id === id) {
          // We need to find the old request to revert selectedRequest correctly,
          // but simplified revert often just refetches.
          // For now just error toast.
          toast.error('Failed to update status');
          fetchRequests();
        }
      }
    } catch (error) {
      toast.error('Error updating status');
      fetchRequests();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Queued':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'contacted':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'in_progress':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'onboarded':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'discarded':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'spam':
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'onboarded':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'discarded':
        return <XCircle className="h-3 w-3" />;
      case 'Queued':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partner Requests</h1>
          <p className="text-sm text-muted-foreground">Manage incoming partnership applications</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={isLoading}
          className="gap-2"
        >
          <Loader2 className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Main Application Area - Flex Row on Desktop / Switch on Mobile */}
      <div className="flex-1 flex overflow-hidden rounded-lg border bg-card shadow-sm">
        {/* --- LEFT PANEL: LIST --- */}
        <div
          className={cn(
            'flex flex-col w-full md:w-[320px] lg:w-[380px] border-r bg-muted/5',
            selectedRequest ? 'hidden md:flex' : 'flex',
          )}
        >
          {/* Search & Filter Header */}
          <div className="p-3 border-b space-y-3 bg-background/50 backdrop-blur-sm shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-9 h-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full h-9 bg-background text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="Queued">Queued</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
                <SelectItem value="discarded">Discarded</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scrollable List Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Loading requests...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center px-4">
                <p className="text-sm font-medium">No requests found</p>
                <p className="text-xs opacity-70 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <button
                  key={req.$id}
                  onClick={() => setSelectedRequest(req)}
                  className={cn(
                    'w-full text-left p-3 rounded-md border transition-all hover:bg-accent group relative',
                    selectedRequest?.$id === req.$id
                      ? 'bg-accent border-primary/20 shadow-sm ring-1 ring-primary/10'
                      : 'bg-transparent border-transparent hover:border-border/50',
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={cn(
                        'font-medium text-sm truncate pr-2',
                        selectedRequest?.$id === req.$id ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {req.companyName || req.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-widest font-semibold opacity-70">
                      {format(new Date(req.$createdAt), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {req.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] h-5 px-1.5 font-normal',
                        getStatusColor(req.status),
                      )}
                    >
                      {req.status}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
          {/* List Footer Stats */}
          <div className="p-2 border-t text-[10px] text-center text-muted-foreground bg-muted/20 shrink-0">
            Showing {filteredRequests.length} request{filteredRequests.length !== 1 && 's'}
          </div>
        </div>

        {/* --- RIGHT PANEL: DETAILS --- */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-background h-full overflow-hidden relative',
            !selectedRequest ? 'hidden md:flex' : 'flex',
          )}
        >
          {selectedRequest ? (
            <>
              {/* Detail Toolbar */}
              <div className="shrink-0 h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10 w-full">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -ml-2 md:hidden shrink-0"
                    onClick={() => setSelectedRequest(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {selectedRequest.companyName || selectedRequest.name}
                    </h2>
                    <p className="text-[10px] text-muted-foreground truncate sm:hidden">
                      {format(new Date(selectedRequest.$createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(val) => handleStatusUpdate(selectedRequest.$id, val)}
                  >
                    <SelectTrigger
                      className={cn(
                        'h-8 w-[130px] border-none shadow-none text-xs font-medium focus:ring-0',
                        getStatusColor(selectedRequest.status),
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="Queued">Queued</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="onboarded">Onboarded</SelectItem>
                      <SelectItem value="discarded">Discarded</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="h-4 w-px bg-border mx-1" />
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Major Header */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      Request ID:{' '}
                      <span className="font-mono">{selectedRequest.$id.substring(0, 8)}</span>
                      <span className="mx-1">•</span>
                      {format(new Date(selectedRequest.$createdAt), 'MMMM d, yyyy h:mm a')}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground break-words">
                      {selectedRequest.companyName || selectedRequest.name}
                    </h1>
                  </div>
                  {/* Action Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Email Address</span>
                      </div>
                      <a
                        href={`mailto:${selectedRequest.email}`}
                        className="text-base font-semibold text-primary hover:underline break-all block"
                      >
                        {selectedRequest.email}
                      </a>
                    </div>
                    <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Phone Number</span>
                      </div>
                      <a
                        href={`tel:${selectedRequest.phone}`}
                        className="text-base font-semibold text-foreground break-all"
                      >
                        {selectedRequest.phone}
                      </a>
                    </div>
                  </div>
                  {/* Detailed Info */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                      <section>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Filter className="h-4 w-4" /> Message / Remarks
                        </h3>
                        <div className="p-6 rounded-lg bg-muted/30 border text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedRequest.remarks || (
                            <span className="text-muted-foreground italic">
                              No message provided.
                            </span>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="p-4 rounded-lg border bg-muted/10 space-y-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Metadata
                        </h3>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Contact Person</p>
                          <div className="flex items-center gap-2 font-medium text-sm">
                            <User className="h-3.5 w-3.5 opacity-70" />
                            {selectedRequest.name}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Website</p>
                          {selectedRequest.companyWebsite ? (
                            <a
                              href={
                                selectedRequest.companyWebsite.startsWith('http')
                                  ? selectedRequest.companyWebsite
                                  : `https://${selectedRequest.companyWebsite}`
                              }
                              target="_blank"
                              className="text-sm font-medium text-primary hover:underline truncate block"
                            >
                              {selectedRequest.companyWebsite}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">N/A</span>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                  <div className="h-20"></div> {/* Bottom Spacer */}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5">
              <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No Request Selected</h3>
              <p className="max-w-xs mx-auto text-sm mt-2 opacity-70">
                Select a request from the sidebar to view its details and take action.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
