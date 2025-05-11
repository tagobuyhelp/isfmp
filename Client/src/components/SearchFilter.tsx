import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface SearchFilterProps {
  onSearch: (value: string) => void;
  onFilterStatus: (status: string) => void;
  onFilterType: (type: string) => void;
  onFilterLocation: (location: {
    state?: string;
    district?: string;
    parliamentConstituency?: string;
  }) => void;
}

interface LocationOptions {
  states: string[];
  districts: string[];
  parliamentConstituencies: string[];
}

const SearchFilter: React.FC<SearchFilterProps> = ({ 
  onSearch, 
  onFilterStatus, 
  onFilterType,
  onFilterLocation 
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [locationOptions, setLocationOptions] = useState<LocationOptions>({
    states: [],
    districts: [],
    parliamentConstituencies: []
  });
  const [selectedLocations, setSelectedLocations] = useState({
    state: '',
    district: '',
    parliamentConstituency: ''
  });

  useEffect(() => {
    fetchLocationOptions();
  }, []);

  const fetchLocationOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/member`);
      const data = await response.json();
      if (data.message.locationOptions) {
        setLocationOptions(data.message.locationOptions);
      }
    } catch (error) {
      console.error('Error fetching location options:', error);
    }
  };

  const handleLocationChange = (field: string, value: string) => {
    const newLocations = {
      ...selectedLocations,
      [field]: value
    };
    setSelectedLocations(newLocations);
    onFilterLocation(newLocations);
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              id="search"
              name="search"
              placeholder="Search members..."
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              id="status-filter"
              name="status"
              onChange={(e) => onFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
            <select 
              id="type-filter"
              name="membershipType"
              onChange={(e) => onFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="active">Active</option>
            </select>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={selectedLocations.state}
                onChange={(e) => handleLocationChange('state', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All States</option>
                {locationOptions.states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <select
                value={selectedLocations.district}
                onChange={(e) => handleLocationChange('district', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Districts</option>
                {locationOptions.districts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parliament Constituency
              </label>
              <select
                value={selectedLocations.parliamentConstituency}
                onChange={(e) => handleLocationChange('parliamentConstituency', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Constituencies</option>
                {locationOptions.parliamentConstituencies.map((constituency) => (
                  <option key={constituency} value={constituency}>{constituency}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;