export interface Video {
  id: string;
  slug: string;
  username: string;
  videoUrl: string;
  caption: string;
  title: string;
  tags: string[];
  likes: number;
  comments: number;
  authorId: string;
  author: {
    name: string;
    bio: string;
    picture: string;
  };
}
