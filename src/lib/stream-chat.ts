import "server-only";

import { StreamChat } from "stream-chat";

export const StreamChat_ = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    process.env.STREAM_CHAT_SECRET_KEY!,
);