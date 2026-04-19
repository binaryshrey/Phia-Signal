import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SharedCartItem = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  linkUrl: string;
};

export type SharedComment = {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
  source: "main" | "friend";
};

export type SharedVotes = {
  cop: number;
  drop: number;
};

export type SharedCartData = {
  items: SharedCartItem[];
  votes: Record<string, SharedVotes>;
  comments: Record<string, SharedComment[]>;
};

type SharedCartStore = {
  carts: Record<string, SharedCartData>;
  publishCart: (cartId: string, items: SharedCartItem[]) => void;
  getCart: (cartId: string) => SharedCartData | null;
  addVote: (cartId: string, itemId: string, type: "cop" | "drop") => void;
  addComment: (cartId: string, itemId: string, comment: SharedComment) => void;
};

export const useSharedCartStore = create<SharedCartStore>()(
  persist(
    (set, get) => ({
      carts: {},

      publishCart: (cartId, items) =>
        set((state) => ({
          carts: {
            ...state.carts,
            [cartId]: {
              items,
              votes: Object.fromEntries(
                items.map((i) => [
                  i.id,
                  state.carts[cartId]?.votes[i.id] ?? { cop: 0, drop: 0 },
                ]),
              ),
              comments: Object.fromEntries(
                items.map((i) => [
                  i.id,
                  state.carts[cartId]?.comments[i.id] ?? [],
                ]),
              ),
            },
          },
        })),

      getCart: (cartId) => get().carts[cartId] ?? null,

      addVote: (cartId, itemId, type) =>
        set((state) => {
          const cart = state.carts[cartId];
          if (!cart) return state;
          const current = cart.votes[itemId] ?? { cop: 0, drop: 0 };
          return {
            carts: {
              ...state.carts,
              [cartId]: {
                ...cart,
                votes: {
                  ...cart.votes,
                  [itemId]: {
                    ...current,
                    [type]: current[type] + 1,
                  },
                },
              },
            },
          };
        }),

      addComment: (cartId, itemId, comment) =>
        set((state) => {
          const cart = state.carts[cartId];
          if (!cart) return state;
          return {
            carts: {
              ...state.carts,
              [cartId]: {
                ...cart,
                comments: {
                  ...cart.comments,
                  [itemId]: [...(cart.comments[itemId] ?? []), comment],
                },
              },
            },
          };
        }),
    }),
    {
      name: "phia-shared-carts",
    },
  ),
);
