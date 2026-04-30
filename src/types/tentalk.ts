export interface Post {
  id: string
  user_id: string
  caption: string
  images: string[]
  hashtags: string[]
  created_at: string
  updated_at: string
  // JOIN
  profiles?: Profile
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  // JOIN
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: 'like' | 'comment'
  post_id: string
  from_user_id: string
  is_read: boolean
  created_at: string
  // JOIN
  profiles?: Profile
  posts?: Post
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  company_name: string | null
  company_name_visible: boolean
  phone: string | null
  location: string | null
  location_visible: boolean
  business_type: string | null
  business_type_visible: boolean
  bio: string | null
  bio_visible: boolean
  plan: 'lite' | 'standard' | 'monitor'
  is_monitor: boolean
  created_at: string
  updated_at: string
}
