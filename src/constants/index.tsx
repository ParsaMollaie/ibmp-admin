import {
  InstagramOutlined,
  LinkedinOutlined,
  TeamOutlined,
  WhatsAppOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import React from 'react';

export const DEFAULT_NAME = 'Umi Max';

export interface SocialNetworkOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export const SOCIAL_NETWORKS: SocialNetworkOption[] = [
  {
    value: 'aparat',
    label: 'آپارات',
    icon: ' AP ',
  },
  {
    value: 'telegram',
    label: 'تلگرام',
    icon: <TeamOutlined />,
  },
  {
    value: 'whatsapp',
    label: 'واتساپ',
    icon: <WhatsAppOutlined />,
  },
  {
    value: 'instagram',
    label: 'اینستاگرام',
    icon: <InstagramOutlined />,
  },
  {
    value: 'youtube',
    label: 'یوتیوب',
    icon: <YoutubeOutlined />,
  },
  {
    value: 'linkedin',
    label: 'لینکدین',
    icon: <LinkedinOutlined />,
  },
];
