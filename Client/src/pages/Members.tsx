import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Printer, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import MemberCard from '../components/MemberCard';
import SearchFilter from '../components/SearchFilter';
import AddMemberModal from '../components/AddMemberModal';
import MemberEditModal from '../components/MemberEditModal';
import PrintLayout from '../components/PrintLayout';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { memberService, Member, CreateMemberPayload } from '../services/api';
import { debounce } from '../utils/debounce';

const Members = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState<{
    state?: string;
    district?: string;
    parliamentConstituency?: string;
  }>({});
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await memberService.getMembers({
        page: currentPage,
        limit,
        search: searchTerm,
        sort: sortField,
        order: sortOrder,
        status: statusFilter,
        membershipType: typeFilter,
        ...locationFilter
      });
      
      const memberData = response?.message?.members ?? [];
      const pagination = response?.message?.pagination;
      
      setMembers(memberData);
      setTotalMembers(pagination?.totalMembers ?? 0);
      setTotalPages(pagination?.totalPages ?? 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchTerm, sortField, sortOrder, statusFilter, typeFilter, locationFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  const handleAddMember = async (data: CreateMemberPayload) => {
    try {
      await memberService.createMember(data);
      fetchMembers();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const handleUpdateMember = async (memberId: string, data: Partial<CreateMemberPayload>) => {
    try {
      await memberService.updateMember(memberId, data);
      fetchMembers();
      setEditMember(null);
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member. Please try again.');
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await memberService.deleteMember(member._id);
        fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete member. Please try again.');
      }
    }
  };

  const handleCheckMembership = async (email: string, phone: string) => {
    try {
      const result = await memberService.checkMembership(email, phone);
      alert(result.data || result.message || 'Membership check completed');
      fetchMembers();
    } catch (error) {
      console.error('Error checking membership:', error);
      alert(error instanceof Error ? error.message : 'Failed to check membership status');
    }
  };

  const handlePrintList = () => {
    setSelectedMember(null);
    window.print();
  };

  const handlePrintMember = (member: Member) => {
    setSelectedMember(member);
    window.print();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchMembers} />;
  }

  const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <div className="flex space-x-3">
            <button 
              onClick={handlePrintList}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-300 hover:bg-gray-50"
            >
              <Printer className="w-5 h-5" />
              <span>Print List</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <SearchFilter
            onSearch={debouncedSearch}
            onFilterStatus={setStatusFilter}
            onFilterType={setTypeFilter}
            onFilterLocation={setLocationFilter}
          />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="fullname">Member</SortableHeader>
                  <SortableHeader field="memberId">Member ID</SortableHeader>
                  <SortableHeader field="aadhaar">Aadhaar</SortableHeader>
                  <SortableHeader field="membershipStatus">Status</SortableHeader>
                  <SortableHeader field="membershipType">Type</SortableHeader>
                  <SortableHeader field="createdAt">Joined</SortableHeader>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <MemberCard 
                    key={member._id}
                    member={member}
                    onPrint={handlePrintMember}
                    onEdit={(member) => setEditMember(member)}
                    onDelete={handleDeleteMember}
                    onCheckMembership={handleCheckMembership}
                  />
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalMembers)} of {totalMembers} members
              </div>
              <div className="flex justify-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded-lg text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddMember}
        />

        {editMember && (
          <MemberEditModal
            isOpen={true}
            member={editMember}
            onClose={() => setEditMember(null)}
            onUpdate={handleUpdateMember}
          />
        )}
      </div>

      <div className="hidden print:block">
        <PrintLayout 
          members={selectedMember ? [selectedMember] : members} 
          type={selectedMember ? 'single' : 'list'} 
        />
      </div>
    </>
  );
};

export default Members;