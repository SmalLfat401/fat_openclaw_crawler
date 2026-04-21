import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/config';

interface FeatureFlags {
  WEIBO_USERS_ENABLED: boolean;
  WEIBO_INTEL_ENABLED: boolean;
  LLM_ENABLED: boolean;
}

interface FeaturesContextType {
  features: FeatureFlags | null;
  loading: boolean;
  error: string | null;
}

const FeaturesContext = createContext<FeaturesContextType>({
  features: null,
  loading: true,
  error: null,
});

export const useFeatures = () => useContext(FeaturesContext);

interface FeaturesProviderProps {
  children: ReactNode;
}

export const FeaturesProvider: React.FC<FeaturesProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: FeatureFlags }>('/features');
        if (response.data.success) {
          setFeatures(response.data.data);
        } else {
          setError('获取功能开关失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取功能开关失败');
      } finally {
        setLoading(false);
      }
    };

    loadFeatures();
  }, []);

  return (
    <FeaturesContext.Provider value={{ features, loading, error }}>
      {children}
    </FeaturesContext.Provider>
  );
};
