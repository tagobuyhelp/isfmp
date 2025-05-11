import React, { useState } from 'react';
import { MoreVertical, Printer, Eye, Trash2, FileText, Download, ChevronDown, Mail, MessageCircle, User } from 'lucide-react';
import { Member, memberService } from '../services/api';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

interface MemberCardProps {
  member: Member;
  onPrint: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onCheckMembership?: (email: string, phone: string) => Promise<void>;
}

const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  onPrint, 
  onEdit,
  onDelete,
  onCheckMembership 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const createdDate = new Date(member.createdAt).toLocaleDateString();
  const dob = new Date(member.dob).toLocaleDateString();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handlePrintMember = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPrint(member);
    setShowActions(false);
  };

  const handleViewMember = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(member);
    setShowActions(false);
  };

  const handleRemoveMember = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(member);
    setShowActions(false);
  };

  const handleCheckMembership = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isChecking || !onCheckMembership) return;
    
    const checkPromise = new Promise(async (resolve, reject) => {
      try {
        setIsChecking(true);
        await onCheckMembership(member.email, member.phone);
        resolve('Membership check completed');
      } catch (error) {
        reject(error instanceof Error ? error.message : 'Failed to check membership status');
      } finally {
        setIsChecking(false);
        setShowActions(false);
      }
    });

    toast.promise(checkPromise, {
      loading: 'Checking membership status...',
      success: (message) => message as string,
      error: (error) => error as string,
    });
  };

  const handleGenerateIdCard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const generatePromise = new Promise(async (resolve, reject) => {
      try {
        await memberService.generateIdCard(member._id);
        resolve('ID card generated successfully');
        window.location.reload();
      } catch (error) {
        reject(error instanceof Error ? error.message : 'Failed to generate ID card');
      }
    });

    toast.promise(generatePromise, {
      loading: 'Generating ID card...',
      success: (message) => message as string,
      error: (error) => error as string,
    });
    
    setShowActions(false);
  };

  const handleDownloadIdCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (member.idCard) {
      const idCardUrl = member.idCard.startsWith('http') 
        ? member.idCard 
        : `${API_BASE_URL}${member.idCard}`;
      window.open(idCardUrl, '_blank');
      toast.success('Downloading ID card...');
    } else {
      toast.error('ID card not available');
    }
    setShowActions(false);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={toggleExpand}>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-25 rounded-lg overflow-hidden flex-shrink-0">
              {member.photo ? (
                <img 
                  src={member.photo.startsWith('http') ? member.photo : `${API_BASE_URL}${member.photo}`}
                  alt={member.fullname}
                  className="h-[90px] w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center ${member.photo ? 'hidden' : ''} ${getRandomColor(member.fullname)}`}>
                <span className="text-2xl font-medium">
                  {getInitials(member.fullname)}
                </span>
              </div>
            </div>
            <div>
  <div className="flex items-center space-x-2">
    <div className="text-sm font-medium text-gray-900">{member.fullname}</div>
    <ChevronDown 
      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
    />
  </div>
  <div className="text-sm text-gray-500">{member.phone}</div>
  <div className="text-sm text-gray-500">{member.email}</div>
</div>

          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {member.memberId ? (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {member.memberId}
            </div>
          ) : (
            <button
              onClick={handleCheckMembership}
              disabled={isChecking}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : 'Verify Membership and Approve'}
            </button>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {member.aadhaar}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            member.membershipStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {member.membershipStatus}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
          {member.membershipType}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{createdDate}</td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showActions && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1" role="menu">
                  <button
                    onClick={handlePrintMember}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Printer className="w-4 h-4 mr-3" />
                    Print Member
                  </button>
                  <button
                    onClick={handleViewMember}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Eye className="w-4 h-4 mr-3" />
                    View/Update
                  </button>
                  {member.memberId && (
                    <button
                      onClick={handleGenerateIdCard}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FileText className="w-4 h-4 mr-3" />
                      Generate ID Card
                    </button>
                  )}
                  {member.idCard && (
                    <button
                      onClick={handleDownloadIdCard}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Download className="w-4 h-4 mr-3" />
                      Download ID Card
                    </button>
                  )}
                  <button
                    onClick={handleRemoveMember}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Date of Birth:</span> {dob}</p>
                  <p><span className="text-gray-500">Aadhaar:</span> {member.aadhaar}</p>
                  <p><span className="text-gray-500">Address:</span> {member.address}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Location Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">State:</span> {member.state}</p>
                  <p><span className="text-gray-500">District:</span> {member.district}</p>
                  <p><span className="text-gray-500">PIN Code:</span> {member.pinCode}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Constituency Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Parliament:</span> {member.parliamentConstituency}</p>
                  <p><span className="text-gray-500">Assembly:</span> {member.assemblyConstituency}</p>
                  <p><span className="text-gray-500">Panchayat:</span> {member.panchayat}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default MemberCard;
