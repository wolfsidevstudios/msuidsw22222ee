
export interface Track {
  id: number;
  name: string;
  file: Blob;
  coverArt?: Blob;
  video?: Blob;
}
