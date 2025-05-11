import React, { useState, useMemo } from 'react';
import { MoreVertical, RefreshCw, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Membership {
  _id: { $oid: string };
  memberId: string;
  email: string;
  phone: string;
  transaction: { $oid: string };
  type: string;
  fee: number;
  validity: number;
  status: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
}

interface MembershipRowProps {
  membership: Membership;
}

const MembershipRow: React.FC<MembershipRowProps> = ({ membership }) => {
  const [showActions, setShowActions] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const validityInfo = useMemo(() => {
    const startDate = new Date(membership.createdAt.$date);
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + membership.validity);
    
    const now = new Date();
    const timeLeft = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    
    let yearsLeft = Math.floor(daysLeft / 365);
    let monthsLeft = Math.floor((daysLeft % 365) / 30);

    const validityText = `${membership.validity / 12} years`;

    let timeLeftText = '';
    if (timeLeft > 0) {
      if (yearsLeft > 0) {
        timeLeftText += `${yearsLeft}y `;
      }
      if (monthsLeft > 0 || yearsLeft === 0) {
        timeLeftText += `${monthsLeft}m`;
      }
    } else {
      timeLeftText = 'Expired';
    }

    return {
      startDate: startDate.toLocaleDateString(),
      expiryDate: endDate.toLocaleDateString(),
      validityText,
      timeLeftText: timeLeftText.trim(),
      isExpired: timeLeft <= 0,
      daysLeft
    };
  }, [membership.createdAt.$date, membership.validity]);

  const handleRenewMembership = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenewing(true);
    try {
      const membershipFee = membership.type === 'active' ? 100 : 20;
      const payload = {
        memberId: membership.memberId,
        amount: membershipFee,
        validity: 36,
        email: membership.email,
        mobileNumber: membership.phone
      };

      console.log('Renewal payload:', payload);

      const response = await fetch(`${API_BASE_URL}/membership/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('API Response:', responseText);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || 'Failed to initiate renewal';
        } catch {
          errorMessage = 'Failed to initiate renewal. Please try again.';
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response from server');
      }
      
      if (data.success && data.data) {
        window.open(data.data, '_blank');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error renewing membership:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate renewal. Please try again.');
    } finally {
      setIsRenewing(false);
      setShowActions(false);
    }
  };

  const handleCancelMembership = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this membership?')) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/membership/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          memberId: membership.memberId
        }),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || 'Failed to cancel membership';
        } catch {
          errorMessage = 'Failed to cancel membership. Please try again.';
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response from server');
      }
      
      if (data.success) {
        alert('Membership cancelled successfully');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error cancelling membership:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel membership. Please try again.');
    } finally {
      setIsCancelling(false);
      setShowActions(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {membership.memberId}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{membership.email}</div>
        <div className="text-sm text-gray-500">{membership.phone}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
        {membership.type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ₹{membership.fee.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{validityInfo.validityText}</div>
        
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          membership.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {membership.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
        <div className="relative">
          <button 
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-500"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showActions && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              onClick={() => setShowActions(false)}
            >
              <div className="py-1" role="menu">
                {(membership.status === 'expired' || validityInfo.isExpired) && (
                  <button
                    onClick={handleRenewMembership}
                    disabled={isRenewing}
                    className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-3" />
                    {isRenewing ? 'Processing...' : 'Renew Membership'}
                  </button>
                )}
                {membership.status === 'active' && !validityInfo.isExpired && (
                  <button
                    onClick={handleCancelMembership}
                    disabled={isCancelling}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                  >
                    <X className="w-4 h-4 mr-3" />
                    {isCancelling ? 'Cancelling...' : 'Cancel Membership'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default MembershipRow;