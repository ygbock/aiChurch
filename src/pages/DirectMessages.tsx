import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, orderBy, getDoc, getDocs, deleteDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import MessageAttachment from '../components/MessageAttachment';
import Modal from '../components/Modal';
import CreatePollModal from '../components/CreatePollModal';
import PollMessage from '../components/PollMessage';
import EventMessage, { EventAttachment } from '../components/EventMessage';
import CreateEventModal, { EventDraft } from '../components/CreateEventModal';
import QuickReplyModal from '../components/QuickReplyModal';
import { 
  Camera,
  Mic,
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  CheckCheck,
  Plus,
  Users,
  MessageSquare,
  X,
  ArrowLeft,
  BarChart2,
  FileText,
  Image as ImageIcon,
  Music,
  Zap,
  Calendar,
  MapPin,
  Reply,
  Copy,
  Trash2,
  Forward,
  Edit2,
  Download,
  CornerUpLeft,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { SharedPostEmbed } from '../components/PostCard';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  sharedPostId?: string;
  attachment?: {
    type: string;
    url: string;
    name: string;
    size: string;
  };
  poll?: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
    allowMultipleAnswers: boolean;
  };
  event?: EventAttachment;
  isEdited?: boolean;
  replyTo?: {
    id: string;
    content: string;
    authorName: string;
  };
  rawReactions?: Record<string, string>;
  reactions?: { emoji: string; count: number; reactedByMe: boolean }[];
  deletedBy?: string[];
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface Chat {
  id: string;
  participants: string[];
  user: User; // The other user
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

declare global {
  interface Window {
    userCache?: Record<string, any>;
  }
}

const EMOJI_CATEGORIES = [
  { name: 'Smileys & Emotion', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'] },
  { name: 'People & Body', emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','💋','🩸'] },
  { name: 'Animals & Nature', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💧','💦','☔️','☂️','🌊','🌫'] },
  { name: 'Food & Drink', emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕️','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂'] },
  { name: 'Travel & Places', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩','💺','🛰','🚀','🛸','🚁','🛶','⛵️','🚤','🛥','🛳','⛴','🚢','⚓️','🪝','⛽️','🚧','🚦','🚥','🚏','🗺','🗿','🗽','🗼','🏰','🏯','🏟','🎡','🎢','🎠','⛲️','⛱','🏖','🏝','🏜','🌋','⛰','🏔','🗻','🏕','⛺️','🛖','🏠','🏡','🏘','🏚','🏗','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛','⛪️','🕌','🕍','🛕','🕋','⛩','🛤','🛣','🗾','🎑','🏞','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙','🌃','🌌','🌉','🌁'] },
  { name: 'Activities', emojis: ['⚽️','🏀','🏈','⚾️','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳️','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️‍♀️','🏋️','🏋️‍♂️','🤼‍♀️','🤼','🤼‍♂️','🤸‍♀️','🤸','🤸‍♂️','⛹️‍♀️','⛹️','⛹️‍♂️','🤺','🤾‍♀️','🤾','🤾‍♂️','🏌️‍♀️','🏌️','🏌️‍♂️','🏇','🧘‍♀️','🧘','🧘‍♂️','🏄‍♀️','🏄','🏄‍♂️','🏊‍♀️','🏊','🏊‍♂️','🤽‍♀️','🤽','🤽‍♂️','🚣‍♀️','🚣','🚣‍♂️','🧗‍♀️','🧗','🧗‍♂️','🚵‍♀️','🚵','🚵‍♂️','🚴‍♀️','🚴','🚴‍♂️','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹‍♀️','🤹','🤹‍♂️','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩'] },
  { name: 'Objects', emojis: ['⌚️','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛️','⏳','📡','🔋','🔌','💡','🔦','🕯','🪔','🧯','🛢','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒','🛠','⛏','🪚','🔩','⚙️','🪤','🧱','⛓','🧲','🔫','💣','🧨','🪓','🔪','🗡','⚔️','🛡','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎','🔑','🗝','🚪','🪑','🛋','🛏','🛌','🧸','🪆','🖼','🛍','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒','🗓','📆','📅','🗑','📇','🗃','🗳','🗄','📋','📁','📂','🗂','🗞','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇','📐','📏','🧮','📌','📍','✂️','🖊','🖋','✒️','🖌','🖍','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'] },
  { name: 'Symbols', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈️','♉️','♊️','♋️','♌️','♍️','♎️','♏️','♐️','♑️','♒️','♓️','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚️','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕️','🛑','⛔️','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗️','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯️','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿️','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸','⏯','⏹','⏺','⏭','⏮','⏩','⏪','🔀','🔁','🔂','◀️','🔼','🔽','⏫','⏬','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫️','⚪️','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾️','◽️','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛️','⬜️','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','👁‍🗨','💬','💭','🗯','♠️','♣️','♥️','♦️','🃏','🎴','🀄️','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','🕜','🕝','🕞','🕟','🕠','🕡','🕢','🕣','🕤','🕥','🕦','🕧'] },
  { name: 'Flags', emojis: ['🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇦🇫','🇦🇽','🇦🇱','🇩🇿','🇦🇸','🇦🇩','🇦🇴','🇦🇮','🇦🇶','🇦🇬','🇦🇷','🇦🇲','🇦🇼','🇦🇺','🇦🇹','🇦🇿','🇧🇸','🇧🇭','🇧🇩','🇧🇧','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇲','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇮🇴','🇻🇬','🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇮🇨','🇨🇻','🇧🇶','🇰🇾','🇨🇫','🇹🇩','🇨🇱','🇨🇳','🇨🇽','🇨🇨','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇰','🇨🇷','🇨🇮','🇭🇷','🇨🇺','🇨🇼','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇲','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇪🇺','🇫🇰','🇫🇴','🇫🇯','🇫🇮','🇫🇷','🇬🇫','🇵🇫','🇹🇫','🇬🇦','🇬🇲','🇬🇪','🇩🇪','🇬🇭','🇬🇮','🇬🇷','🇬🇱','🇬🇩','🇬🇵','🇬🇺','🇬🇹','🇬🇬','🇬🇳','🇬🇼','🇬🇾','🇭🇹','🇭🇳','🇭🇰','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇲','🇮🇱','🇮🇹','🇯🇲','🇯🇵','🎌','🇯🇪','🇯🇴','🇰🇿','🇰🇪','🇰🇮','🇽🇰','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇮','🇱🇹','🇱🇺','🇲🇴','🇲🇰','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇭','🇲🇶','🇲🇷','🇲🇺','🇾🇹','🇲🇽','🇫🇲','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇸','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇷','🇳🇵','🇳🇱','🇳🇨','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇳🇺','🇳🇫','🇰🇵','🇲🇵','🇳🇴','🇴🇲','🇵🇰','🇵🇼','🇵🇸','🇵🇦','🇵🇬','🇵🇾','🇵🇪','🇵🇭','🇵🇳','🇵🇱','🇵🇹','🇵🇷','🇶🇦','🇷🇪','🇷🇴','🇷🇺','🇷🇼','🇼🇸','🇸🇲','🇸🇹','🇸🇦','🇸🇳','🇷🇸','🇸🇨','🇸🇱','🇸🇬','🇸🇽','🇸🇰','🇸🇮','🇬🇸','🇸🇧','🇸🇴','🇿🇦','🇰🇷','🇸🇸','🇪🇸','🇱🇰','🇧🇱','🇸🇭','🇰🇳','🇱🇨','🇵🇲','🇻🇨','🇸🇩','🇸🇷','🇸🇿','🇸🇪','🇨🇭','🇸🇾','🇹🇼','🇹🇯','🇹🇿','🇹🇭','🇹🇱','🇹🇬','🇹🇰','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇹🇨','🇹🇻','🇻🇮','🇺🇬','🇺🇦','🇦🇪','🇬🇧','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🏴󠁧󠁢󠁷󠁬󠁳󠁿','🇺🇸','🇺🇾','🇺🇿','🇻🇺','🇻🇦','🇻🇪','🇻🇳','🇼🇫','🇪🇭','🇾🇪','🇿🇲','🇿🇼'] }
];

export default function DirectMessages() {
  const { chatId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const toUserId = searchParams.get('to');
  
  const [activeChatId, setActiveChatId] = useState<string | null>(chatId || null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>({});
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{name: string, type: string, size: string, url: string, file: File, source?: string} | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, type: string, name: string} | null>(null);
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [emojiDrawerMessageId, setEmojiDrawerMessageId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showMessageStatsId, setShowMessageStatsId] = useState<string | null>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useAudioRecorder();
  
  // Auto collapse menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) {
        setShowChatMenu(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardChatId, setForwardChatId] = useState('');
  const [forwardContext, setForwardContext] = useState('');
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id?: string, type: 'single' | 'multiple' } | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [isInitializingChat, setIsInitializingChat] = useState(!!toUserId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, profile } = useFirebase();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveChatId(chatId || null);
  }, [chatId]);

  // Handle ?to= user resolving
  useEffect(() => {
    if (!user || !toUserId) return;
    
    let isMounted = true;
    const initializeChatWithUser = async () => {
      try {
        // Find existing chat
        const q = query(
          collection(db, 'directMessageChats'),
          where('participants', 'array-contains', user.uid)
        );
        const snap = await getDocs(q);
        let foundChatId = null;
        snap.forEach(doc => {
          const data = doc.data();
          if (data.participants.includes(toUserId) && data.participants.length === 2 && !data.isGroup) {
            foundChatId = doc.id;
          }
        });

        if (foundChatId) {
          if (isMounted) {
            navigate(`/direct-messages/${foundChatId}`, { replace: true });
          }
        } else {
          // Create new
          const newChat = await addDoc(collection(db, 'directMessageChats'), {
              participants: [user.uid, toUserId],
              lastMessage: '',
              lastMessageTime: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
          });
          if (isMounted) {
            navigate(`/direct-messages/${newChat.id}`, { replace: true });
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      } finally {
        if (isMounted) setIsInitializingChat(false);
      }
    };
    
    initializeChatWithUser();
    
    return () => { isMounted = false; }
  }, [user, toUserId, navigate]);

  const activeChat = chats.find(c => c.id === activeChatId);

  // Load basic chats
  useEffect(() => {
    if (!user) return;

    // In a real app we would query directMessageChats where participants array contains user.uid
    // For now we just load DMs involving this user.
    const q = query(
      collection(db, 'directMessageChats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
            const newUsersToFetch = new Set<string>();
            const currentChats = snapshot.docs.map(docSnapshot => {
                const data = docSnapshot.data();
                const otherParticipantId = data.participants.find((p: string) => p !== user.uid) || 'unknown';
                if (otherParticipantId !== 'unknown' && !window.userCache?.[otherParticipantId]) {
                    newUsersToFetch.add(otherParticipantId);
                }
                return { id: docSnapshot.id, data, otherParticipantId };
            });

            if (!window.userCache) {
                 window.userCache = {};
            }

            if (newUsersToFetch.size > 0) {
                 await Promise.all(Array.from(newUsersToFetch).map(async (uid) => {
                     try {
                         const userDoc = await getDoc(doc(db, 'users', uid));
                         if (userDoc.exists()) {
                             window.userCache[uid] = userDoc.data();
                         }
                     } catch (e) {
                         console.error(e);
                     }
                 }));
            }

            const loadedChats = currentChats.map(({ id, data, otherParticipantId }) => {
                 const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
                 const updatedAt = data.updatedAt ? data.updatedAt.toDate() : createdAt;
                 
                 let otherUser = {
                     id: otherParticipantId,
                     name: 'Unknown User',
                     role: 'Member',
                     initials: '?',
                     status: 'offline',
                     avatar: undefined
                 };
                 
                 if (otherParticipantId !== 'unknown' && window.userCache[otherParticipantId]) {
                     const userData = window.userCache[otherParticipantId];
                     otherUser = {
                         id: otherParticipantId,
                         name: userData.fullName || 'Unknown User',
                         role: userData.role || 'Member',
                         initials: userData.fullName ? userData.fullName.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase() : '?',
                         status: 'online',
                         avatar: userData.photoUrl
                     };
                 }
                
                 let timeString = '';
                 const diffInMinutes = Math.floor((new Date().getTime() - updatedAt.getTime()) / 60000);
                 if (diffInMinutes < 60) timeString = `${diffInMinutes}m ago`;
                 else if (diffInMinutes < 1440) timeString = `${Math.floor(diffInMinutes / 60)}h ago`;
                 else timeString = 'Yesterday';

                return {
                    id: id,
                    participants: data.participants,
                    lastMessage: data.lastMessage || 'Start a conversation',
                    lastMessageTime: data.lastMessageTime ? data.lastMessageTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) : timeString,
                    unreadCount: 0,
                    user: otherUser,
                    messages: [],
                    _updatedAt: updatedAt.getTime()
                } as Chat & { _updatedAt: number };
            });
            
            // Sort chats by updatedAt
            loadedChats.sort((a, b) => b._updatedAt - a._updatedAt);
            
            setChats(prev => {
                return loadedChats.map(newChat => {
                    const existingChat = prev.find(p => p.id === newChat.id);
                    if (existingChat) {
                        return { ...newChat, messages: existingChat.messages };
                    }
                    return newChat;
                });
            });
        } catch(error) {
            handleFirestoreError(error, OperationType.LIST, 'directMessageChats');
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'directMessageChats');
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for active chat
  useEffect(() => {
    if (!user || !activeChatId) return;

    const messagesRef = collection(db, 'directMessageChats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
            const fetchedMessages = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
                
                return {
                    id: doc.id,
                    senderId: data.senderId === user.uid ? 'me' : data.senderId,
                    text: data.text,
                    sharedPostId: data.sharedPostId || null,
                    attachment: data.attachment || undefined,
                    poll: data.poll || undefined,
                    event: data.event || undefined,
                    isEdited: data.isEdited || false,
                    replyTo: data.replyTo || undefined,
                    rawReactions: data.reactions || undefined,
                    deletedBy: data.deletedBy || [],
                    status: data.status,
                    time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                } as ChatMessage;
            });

            setMessagesByChat(prev => ({
                ...prev,
                [activeChatId]: fetchedMessages
            }));
            
            // Mark non-me messages as read
            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.senderId !== user.uid && data.status !== 'read') {
                    updateDoc(doc(db, 'directMessageChats', activeChatId, 'messages', docSnap.id), {
                        status: 'read'
                    }).catch(error => {
                        // ignore failures if permission denied on read
                    });
                }
            });

        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, `directMessageChats/${activeChatId}/messages`);
        }
    }, error => {
        handleFirestoreError(error, OperationType.LIST, `directMessageChats/${activeChatId}/messages`);
    });

    return () => unsubscribe();
  }, [activeChatId, user]);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatId, chats]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, source: string = 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Max size is 20MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    setPendingAttachment({
      name: file.name,
      type: file.type,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      url: URL.createObjectURL(file),
      file,
      source
    });
    
    setShowAttachmentMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const toggleMessageSelection = (msgId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(msgId)) {
      newSelected.delete(msgId);
      if (newSelected.size === 0) setIsSelectionMode(false);
    } else {
      newSelected.add(msgId);
    }
    setSelectedMessages(newSelected);
  };

  const handleCopyMessages = () => {
    const activeMessages = messagesByChat[activeChatId!] || [];
    if (selectedMessages.size === 0) return;
    const text = activeMessages
      .filter((m: ChatMessage) => selectedMessages.has(m.id))
      .map((m: ChatMessage) => m.text || (m.attachment ? `[Attachment: ${m.attachment.name}]` : ''))
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Messages copied to clipboard');
    setIsSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleDeleteMessage = async (messageId: string) => {
    setDeleteConfirmInfo({ type: 'single', id: messageId });
  };

  const confirmDeleteSingle = async (messageId: string, forEveryone: boolean) => {
    if (!activeChatId || !user) return;
    try {
      const msgRef = doc(db, 'directMessageChats', activeChatId, 'messages', messageId);
      const activeMessages = messagesByChat[activeChatId] || [];
      const msgObj = activeMessages.find((m: ChatMessage) => m.id === messageId);
      if (forEveryone && msgObj && msgObj.senderId === 'me') {
         await deleteDoc(msgRef);
      } else {
         await updateDoc(msgRef, { deletedBy: arrayUnion(user.uid) });
      }
      toast.success('Message deleted');
    } catch (error: any) {
      toast.error(`Failed to delete message: ${error?.message || error}`);
      handleFirestoreError(error, OperationType.DELETE, `directMessageChats/${activeChatId}/messages/${messageId}`);
    } finally {
      setDeleteConfirmInfo(null);
    }
  };

  const confirmDeleteMultiple = async (forEveryone: boolean) => {
    if (!activeChatId || !user || selectedMessages.size === 0) return;
    try {
      const activeMessages = messagesByChat[activeChatId] || [];
      const promises = Array.from(selectedMessages).map(id => {
        const msgRef = doc(db, 'directMessageChats', activeChatId, 'messages', id);
        const msgObj = activeMessages.find((m: ChatMessage) => m.id === id);
        if (forEveryone && msgObj && msgObj.senderId === 'me') {
           return deleteDoc(msgRef);
        } else {
           return updateDoc(msgRef, { deletedBy: arrayUnion(user.uid) });
        }
      });
      await Promise.all(promises);
      toast.success('Messages deleted');
      setIsSelectionMode(false);
      setSelectedMessages(new Set());
    } catch (error: any) {
      toast.error(`Failed to delete messages: ${error?.message || error}`);
    } finally {
      setDeleteConfirmInfo(null);
    }
  };

  const handleForwardMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardChatId || selectedMessages.size === 0 || !user || !profile || !activeChatId) return;

    setIsSubmitting(true);
    try {
      const activeMessages = messagesByChat[activeChatId] || [];
      const messagesToForward = activeMessages
        .filter((m: ChatMessage) => selectedMessages.has(m.id))
        .sort((a, b) => {
           // Basic chronological sort using time string or assuming array order
           return activeMessages.indexOf(a) - activeMessages.indexOf(b);
        });

      const forwardChatRef = doc(db, 'directMessageChats', forwardChatId);
      const forwardMessagesRef = collection(db, 'directMessageChats', forwardChatId, 'messages');

      for (const msg of messagesToForward) {
        let textContent = '';
        if (msg.text) textContent += msg.text;
        
        await addDoc(forwardMessagesRef, {
            senderId: user.uid,
            text: textContent,
            status: 'sent',
            attachment: msg.attachment || null,
            poll: msg.poll || null,
            replyTo: null,
            createdAt: serverTimestamp()
        });
      }

      if (forwardContext.trim() !== '') {
        await addDoc(forwardMessagesRef, {
            senderId: user.uid,
            text: forwardContext.trim(),
            status: 'sent',
            createdAt: serverTimestamp()
        });
      }

      await updateDoc(forwardChatRef, {
          lastMessage: forwardContext.trim() || 'Forwarded message',
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp()
      });

      toast.success('Forwarded message(s)');
      setIsForwardModalOpen(false);
      setIsSelectionMode(false);
      setSelectedMessages(new Set());
      setForwardChatId('');
      setForwardContext('');
      navigate(`/direct-messages/${forwardChatId}`);
      
    } catch (error) {
      toast.error('Failed to forward messages');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyMessage = (msg: ChatMessage) => {
    const otherUser = chats.find(c => c.id === activeChatId)?.user;
    setReplyingToMessage({
       ...msg,
       senderId: msg.senderId,
       text: msg.text || (msg.attachment ? `[Attachment]` : ''),
       // In reply context authorName is needed
       authorName: msg.senderId === 'me' ? profile?.fullName || 'Me' : otherUser?.name || 'User'
    } as any);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeChatId || !user) return;
    try {
      const msgRef = doc(db, 'directMessageChats', activeChatId, 'messages', messageId);
      const msgDoc = await getDoc(msgRef);
      if (msgDoc.exists()) {
        const currentReactions = msgDoc.data().reactions || {};
        if (currentReactions[user.uid] === emoji) {
          delete currentReactions[user.uid];
        } else {
          currentReactions[user.uid] = emoji;
        }
        await updateDoc(msgRef, { reactions: currentReactions });
      }
    } catch (error) {
       toast.error('Failed to react');
    }
  };

  const handleShareLocation = () => {
    setShowAttachmentMenu(false);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting location...', { id: 'location' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        toast.success('Location attached', { id: 'location' });
        setPendingAttachment({
          name: 'My Location',
          type: 'location/gps',
          size: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
          file: new File([], 'location.url'),
          source: 'location'
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable permissions.';
        }
        toast.error(errorMessage, { id: 'location' });
      }
    );
  };

  const clearAttachment = () => {
    setPendingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSendPoll = async (pollData: any) => {
    if (!activeChat || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
        const chatRef = doc(db, 'directMessageChats', activeChatId!);
        const messagesRef = collection(db, 'directMessageChats', activeChatId!, 'messages');
        
        const formattedPoll = {
            ...pollData,
            options: pollData.options.map((opt: any) => ({ ...opt, votes: [] }))
        };

        await addDoc(messagesRef, {
            senderId: user.uid,
            text: '',
            poll: formattedPoll,
            status: 'sent',
            createdAt: serverTimestamp()
        });

        await updateDoc(chatRef, {
            lastMessage: 'Sent a poll',
            lastMessageTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        setShowPollModal(false);
    } catch(error) {
       toast.error('Failed to create poll');
       handleFirestoreError(error, OperationType.CREATE, `directMessageChats/${activeChatId}/messages`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendEvent = async (eventData: EventDraft) => {
    if (!activeChat || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
        const chatRef = doc(db, 'directMessageChats', activeChatId!);
        const messagesRef = collection(db, 'directMessageChats', activeChatId!, 'messages');
        
        const formattedEvent = {
            ...eventData,
            attendees: [user.uid] // Creator auto-attends
        };

        await addDoc(messagesRef, {
            senderId: user.uid,
            text: '',
            event: formattedEvent,
            status: 'sent',
            createdAt: serverTimestamp()
        });

        await updateDoc(chatRef, {
            lastMessage: '📅 Event: ' + formattedEvent.name,
            lastMessageTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        setShowEventModal(false);
    } catch(error: any) {
       toast.error(`Failed to create event: ${error?.message || 'Unknown error'}`);
       handleFirestoreError(error, OperationType.CREATE, `directMessageChats/${activeChatId}/messages`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !pendingAttachment) || !activeChat || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
        const chatRef = doc(db, 'directMessageChats', activeChatId!);
        const messagesRef = collection(db, 'directMessageChats', activeChatId!, 'messages');
        
        const messageData: any = {
            senderId: user.uid,
            text: messageText,
            status: 'sent',
            createdAt: serverTimestamp()
        };

        if (replyingToMessage) {
            messageData.replyTo = {
                id: replyingToMessage.id,
                content: replyingToMessage.text || (replyingToMessage.attachment ? '[Attachment]' : ''),
                authorName: (replyingToMessage as any).authorName || (replyingToMessage.senderId === 'me' ? profile?.fullName : chats.find(c => c.id === activeChatId)?.user.name) || 'User',
            };
        }

        if (editingMessageId) {
            const msgRef = doc(db, 'directMessageChats', activeChatId!, 'messages', editingMessageId);
            await updateDoc(msgRef, {
                text: messageText,
                isEdited: true
            });
            setEditingMessageId(null);
            
            await updateDoc(chatRef, {
                lastMessage: messageText,
                updatedAt: serverTimestamp()
            });
        } else {
            if (pendingAttachment) {
                if (pendingAttachment.source === 'location') {
                    messageData.attachment = {
                        name: pendingAttachment.name,
                        type: pendingAttachment.type,
                        size: pendingAttachment.size,
                        url: pendingAttachment.url
                    };
                } else {
                    const fileExtension = pendingAttachment.name.split('.').pop() || 'unknown';
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
                    const storageRef = ref(storage, `directMessages/${activeChatId}/${fileName}`);
                    
                    const uploadTask = await uploadBytesResumable(storageRef, pendingAttachment.file);
                    const fileUrl = await getDownloadURL(uploadTask.ref);
                    
                    messageData.attachment = {
                        name: pendingAttachment.name,
                        type: pendingAttachment.type,
                        size: pendingAttachment.size,
                        url: fileUrl
                    };
                }
            }

            await addDoc(messagesRef, messageData);

            await updateDoc(chatRef, {
                lastMessage: pendingAttachment ? (messageText || 'Sent an attachment') : messageText,
                lastMessageTime: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        setMessageText('');
        setReplyingToMessage(null);
        clearAttachment();
    } catch(error) {
       toast.error('Failed to send message');
       handleFirestoreError(error, OperationType.CREATE, `directMessageChats/${activeChatId}/messages`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Social Tab Navigation */}
      <div className={`-mx-4 px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 gap-6 md:gap-8 border-b border-slate-200 mb-2 overflow-x-auto no-scrollbar w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChatId ? 'hidden lg:flex' : 'flex'}`}>
        {[
          { label: 'Feed', path: '/community-feed', mobileOnly: false },
          { label: 'Channels', path: '/ministry-channels', mobileOnly: false },
          { label: 'Messages', path: '/direct-messages', mobileOnly: false },
          { label: 'Announcements', path: '/communication', mobileOnly: true }
        ].map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`shrink-0 pb-4 text-sm font-bold transition-all whitespace-nowrap relative ${
              tab.mobileOnly ? 'md:hidden' : ''
            } ${
              location.pathname === tab.path 
                ? 'text-indigo-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {location.pathname === tab.path && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      <div className={`flex bg-white lg:rounded-2xl lg:border lg:border-slate-200 shadow-sm overflow-hidden relative -mx-4 md:-mx-6 lg:mx-0 w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChatId ? 'h-[calc(100vh-100px)] lg:h-[calc(100vh-200px)] border-t border-slate-200 lg:border-t-0' : 'h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)]'}`}>
      {/* Search & List Panel */}
      <div className={`flex flex-col w-full lg:w-96 lg:border-r border-slate-200 bg-white ${activeChatId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Direct Messages</h3>
            <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="New Message">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => navigate(`/direct-messages/${chat.id}`)}
              className={`w-full flex items-start gap-3 p-4 transition-all hover:bg-slate-50 text-left relative ${
                activeChatId === chat.id ? 'bg-indigo-50/50 border-r-2 border-indigo-600' : ''
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 group-hover:scale-105 transition-transform overflow-hidden">
                  {chat.user.avatar ? (
                    <img src={chat.user.avatar} alt={chat.user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    chat.user.initials
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                  chat.user.status === 'online' ? 'bg-emerald-500' : 
                  chat.user.status === 'away' ? 'bg-amber-500' : 'bg-slate-300'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-sm font-bold truncate ${activeChatId === chat.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {chat.user.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">{chat.lastMessageTime}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
              </div>
              {chat.unreadCount > 0 && (
                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                  {chat.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* active Chat Area */}
      <div className={`flex-1 flex-col bg-[#efeae2] relative ${activeChatId ? 'flex' : 'hidden lg:flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="h-16 lg:h-20 px-4 lg:px-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-2 lg:gap-4 flex-1">
                <button 
                  onClick={() => navigate('/direct-messages')}
                  className="lg:hidden p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors -ml-2"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-xl transition-colors" onClick={() => setIsChatInfoOpen(true)}>
                  <div className="relative">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm overflow-hidden border border-slate-200">
                      {activeChat.user.avatar ? (
                        <img src={activeChat.user.avatar} alt={activeChat.user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (    
                        activeChat.user.initials
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                      activeChat.user.status === 'online' ? 'bg-emerald-500' : 
                      activeChat.user.status === 'away' ? 'bg-amber-500' : 'bg-slate-300'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-none">{activeChat.user.name}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                      {activeChat.user.status === 'online' ? 'Active Now' : `Last seen ${activeChat.user.lastSeen || 'recently'}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Audio Call">
                  <Phone size={18} />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Video Call">
                  <Video size={18} />
                </button>
                <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  <MoreVertical size={18} />
                </button>
                {showChatMenu && (
                  <div ref={chatMenuRef} className="absolute top-16 right-4 w-56 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 py-1 flex flex-col">
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">View Contact</button>
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Search</button>
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Media, Links, and Docs</button>
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Mute Notifications</button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">Report</button>
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">Block</button>
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">Clear Chat</button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6"
            >
              <div className="flex justify-center mb-8">
                <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                  Conversation Started
                </span>
              </div>

              {(messagesByChat[activeChatId!] || [])
                .filter(msg => !msg.deletedBy?.includes(user!.uid))
                .map((msg) => {
                  const isMe = msg.senderId === 'me';
                  const isSelected = selectedMessages.has(msg.id);
                  return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSelected ? 'bg-black/5 mx-[-2rem] px-[2rem] py-1' : ''}`}
                >
                  <div className={`flex gap-3 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''} group relative px-2 py-1 -mx-2 rounded-lg 
                       ${isSelectionMode ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                       onClick={() => {
                         if (isSelectionMode) toggleMessageSelection(msg.id);
                       }}
                       onContextMenu={(e) => {
                         e.preventDefault();
                         if (!isSelectionMode) {
                           setIsSelectionMode(true);
                           toggleMessageSelection(msg.id);
                         }
                       }}
                  >
                    <div className={`flex flex-col gap-1 relative ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                      <div 
                        onClick={() => !isSelectionMode && setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                        className={`px-3 py-2 text-[15px] shadow-sm leading-relaxed break-words whitespace-pre-wrap relative min-w-[70px] ${
                        isMe 
                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-2xl rounded-tr-none' 
                          : 'bg-white text-[#111b21] rounded-2xl rounded-tl-none'
                      }`}>
                        
                        {msg.replyTo && (
                          <div className={`mb-1.5 pl-2 border-l-2 rounded-sm p-1.5 text-xs ${isMe ? 'border-[#00a884] bg-white/40 flex-row-reverse' : 'border-slate-300 bg-slate-50'}`}>
                            <p className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-[#00a884] flex flex-row-reverse' : 'text-slate-500'}`}>{msg.replyTo.authorName}</p>
                            <p className={`truncate ${isMe ? 'text-slate-700 flex flex-row-reverse' : 'text-slate-600'}`}>{msg.replyTo.content}</p>
                          </div>
                        )}

                        {msg.attachment && (
                          <MessageAttachment attachment={msg.attachment} isMe={isMe} setPreviewFile={setPreviewFile} />
                        )}
                        {msg.poll && (
                          <PollMessage 
                             poll={msg.poll} 
                             messageId={msg.id} 
                             chatId={activeChatId!} 
                             currentUserId={user!.uid} 
                             isDirectMessage={true}
                          />
                        )}
                        {msg.event && (
                          <EventMessage 
                             event={msg.event} 
                             messageId={msg.id} 
                             chatId={activeChatId!} 
                             currentUserId={user!.uid} 
                             isDirectMessage={true}
                          />
                        )}
                        {msg.text}
                        {msg.sharedPostId && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <SharedPostEmbed sharedPostId={msg.sharedPostId} />
                          </div>
                        )}
                        <div className={`float-right flex items-center gap-1.5 mt-2 ml-3 -mr-1 -mb-1`}>
                          {msg.isEdited && <span className="text-[10px] text-black/40 italic">Edited</span>}
                          <span className={`text-[10px] font-bold uppercase ${isMe ? 'text-[#00a884]' : 'text-slate-400'}`}>{msg.time}</span>
                          {isMe && (
                            <CheckCheck size={14} className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'} />
                          )}
                        </div>
                        <div className="clear-both" />
                      </div>
                      
                      {/* Reaction Picker and Actions Modal */}
                      <div className={`absolute -top-12 lg:-top-2 ${activeMessageId === msg.id ? 'opacity-100 scale-100 z-20 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none lg:pointer-events-auto'} lg:group-hover:opacity-100 lg:group-hover:scale-100 transition-all duration-200 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-1.5 lg:py-1 shadow-lg lg:shadow-sm ${isMe ? 'right-0 lg:-left-2 lg:right-auto' : 'left-0 lg:-right-2 lg:left-auto'} min-w-max`}>
                         {['👍', '❤️', '🙏', '🔥'].map(emoji => (
                           <button
                             key={emoji}
                             onClick={(e) => {
                               e.stopPropagation();
                               handleReaction(msg.id, emoji);
                               setActiveMessageId(null);
                             }}
                             className="text-lg lg:text-base hover:scale-125 hover:-translate-y-1 transition-transform p-1"
                           >
                             {emoji}
                           </button>
                         ))}
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             setEmojiDrawerMessageId(msg.id);
                             setActiveMessageId(null);
                           }}
                           className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors ml-1"
                           title="More Emojis"
                         >
                           <Plus size={16} />
                         </button>
                         <div className="w-px h-4 bg-slate-200 mx-1 hidden lg:block" />
                         <button onClick={(e) => { e.stopPropagation(); handleReplyMessage(msg); setActiveMessageId(null); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors hidden lg:flex" title="Reply">
                           <Reply size={14} />
                         </button>
                         {isMe && !msg.poll && !msg.attachment && (
                           <button onClick={(e) => { e.stopPropagation(); setEditingMessageId(msg.id); setMessageText(msg.text); setActiveMessageId(null); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors hidden lg:flex" title="Edit">
                             <Edit2 size={14} />
                           </button>
                         )}
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); setActiveMessageId(null); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors hidden lg:flex" title="Delete">
                           <Trash2 size={14} />
                         </button>
                      </div>

                      {msg.rawReactions && Object.keys(msg.rawReactions).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(
                            Object.entries(msg.rawReactions).reduce((acc: any, [uid, emoji]) => {
                              if (!acc[emoji as string]) {
                                acc[emoji as string] = { count: 0, reactedByMe: false };
                              }
                              acc[emoji as string].count += 1;
                              if (uid === user?.uid) acc[emoji as string].reactedByMe = true;
                              return acc;
                            }, {})
                          ).map(([emoji, data]: any) => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-full text-[10px] shadow-sm transition-colors cursor-pointer ${data.reactedByMe ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                            >
                              <span>{emoji}</span>
                              <span className={`font-bold ${data.reactedByMe ? 'text-indigo-600' : 'text-slate-500'}`}>{data.count as number}</span>
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )})}
            </div>

            {/* Input Area */}
            <div className={`p-2 md:p-3 mt-auto w-full border-t-0 flex flex-col relative transition-colors duration-300 ${isSelectionMode ? 'bg-indigo-50 border-t border-indigo-100' : 'bg-transparent'}`}>
              
              {/* Selection Mode Header */}
              {isSelectionMode && (
                <div className="absolute top-0 left-0 right-0 -translate-y-full bg-white border-y border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-30">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setIsSelectionMode(false); setSelectedMessages(new Set()); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={20} />
                    </button>
                    <span className="text-sm font-bold text-slate-700">{selectedMessages.size} selected</span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <button onClick={() => setIsForwardModalOpen(true)} className="p-2 lg:p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all font-medium text-xs lg:text-sm flex items-center justify-center lg:gap-2">
                      <Forward size={18} />
                      <span className="hidden lg:inline">Forward</span>
                    </button>
                    <button onClick={handleCopyMessages} className="p-2 lg:p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all font-medium text-xs lg:text-sm flex items-center justify-center lg:gap-2">
                      <Copy size={18} />
                      <span className="hidden lg:inline">Copy</span>
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button onClick={() => confirmDeleteMultiple(true)} className="p-2 lg:p-2.5 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all font-medium text-xs lg:text-sm flex items-center justify-center lg:gap-2">
                      <Trash2 size={18} />
                    </button>
                    <div className="relative">
                      <button onClick={() => setShowSelectionMenu(!showSelectionMenu)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                         <MoreVertical size={18} />
                      </button>
                      {showSelectionMenu && (
                         <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50">
                            <div className="py-1 flex flex-col">
                              {selectedMessages.size === 1 && activeChatId && messagesByChat[activeChatId]?.find(m => m.id === Array.from(selectedMessages)[0])?.senderId === 'me' && (
                                <>
                                  <button onClick={() => {
                                    const msgId = Array.from(selectedMessages)[0];
                                    if (msgId) {
                                      setShowMessageStatsId(msgId);
                                      setIsSelectionMode(false);
                                      setSelectedMessages(new Set());
                                      setShowSelectionMenu(false);
                                    }
                                  }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                    <Info size={16} /> Message Info
                                  </button>
                                </>
                              )}
                              {selectedMessages.size === 1 && activeChatId && messagesByChat[activeChatId]?.find(m => m.id === Array.from(selectedMessages)[0])?.senderId === 'me' && (
                                <button onClick={() => {
                                  const msgId = Array.from(selectedMessages)[0];
                                  const msg = messagesByChat[activeChatId]?.find(m => m.id === msgId);
                                  if (msg) {
                                    setEditingMessageId(msg.id);
                                    setMessageText(msg.text);
                                    setIsSelectionMode(false);
                                    setSelectedMessages(new Set());
                                    setShowSelectionMenu(false);
                                  }
                                }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                  <Edit2 size={16} /> Edit Message
                                </button>
                              )}
                            </div>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reply Preview */}
              <AnimatePresence>
                {replyingToMessage && !isSelectionMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 mx-12 overflow-hidden relative"
                  >
                    <div className="bg-slate-50 border-l-4 border-indigo-500 p-2 lg:p-3 rounded-r-xl lg:rounded-r-2xl border border-slate-200 flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-1.5 mb-1">
                           <Reply size={12} className="text-indigo-500" />
                           <p className="text-xs font-bold text-indigo-600">Replying to {(replyingToMessage as any).authorName}</p>
                         </div>
                         <p className="text-sm text-slate-600 truncate">{replyingToMessage.text || (replyingToMessage.attachment ? '[Attachment]' : '')}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setReplyingToMessage(null)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0 m-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Edit Preview */}
              <AnimatePresence>
                {editingMessageId && !isSelectionMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 mx-12 overflow-hidden relative"
                  >
                    <div className="bg-sky-50 border-l-4 border-sky-500 p-2 lg:p-3 rounded-r-xl lg:rounded-r-2xl border border-slate-200 flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-1.5 mb-1">
                           <Edit2 size={12} className="text-sky-500" />
                           <p className="text-xs font-bold text-sky-600">Editing Message</p>
                         </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setEditingMessageId(null); setMessageText(''); }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0 m-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attachment Preview */}
              <AnimatePresence>
                {pendingAttachment && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="mb-3 mx-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {pendingAttachment.type.startsWith('image/') ? (
                        <img src={pendingAttachment.url} alt="preview" className="w-full h-full object-cover" />
                      ) : pendingAttachment.type.startsWith('video/') ? (
                        <Video size={24} className="text-slate-400" />
                      ) : (
                        <Paperclip size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{pendingAttachment.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pendingAttachment.size}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearAttachment}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden Inputs */}
              <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'document')} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,audio/*" />
              <input type="file" ref={cameraInputRef} onChange={(e) => handleFileUpload(e, 'camera')} className="hidden" accept="image/*,video/*" capture="environment" />

              <form 
                onSubmit={handleSendMessage}
                className="flex items-end gap-2 w-full max-w-full relative"
              >
                {/* Attachment Menu Popover */}
                <AnimatePresence>
                  {showAttachmentMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-12 mb-2 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 origin-bottom-right"
                    >
                      <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                        <label htmlFor="upload-document-dm" className="flex flex-col items-center gap-1 group cursor-pointer">
                           <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                             <FileText size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Document</span>
                        </label>
                        <label htmlFor="upload-camera-dm" className="flex flex-col items-center gap-1 group cursor-pointer">
                           <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                             <Camera size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Camera</span>
                        </label>
                        <label htmlFor="upload-gallery-dm" className="flex flex-col items-center gap-1 group cursor-pointer">
                           <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                             <ImageIcon size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Gallery</span>
                        </label>
                        <label htmlFor="upload-audio-dm" className="flex flex-col items-center gap-1 group cursor-pointer">
                           <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                             <Music size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Audio</span>
                        </label>
                        <button type="button" onClick={() => { setMessageText('/'); setShowQuickReplyModal(true); setShowAttachmentMenu(false); }} className="flex flex-col items-center gap-1 group">
                           <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                             <Zap size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Quick Reply</span>
                        </button>
                        <button type="button" onClick={() => { setShowPollModal(true); setShowAttachmentMenu(false); }} className="flex flex-col items-center gap-1 group">
                           <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                             <BarChart2 size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Poll</span>
                        </button>
                        <button type="button" onClick={() => { setShowEventModal(true); setShowAttachmentMenu(false); }} className="flex flex-col items-center gap-1 group">
                           <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                             <Calendar size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Event</span>
                        </button>
                        <button type="button" onClick={handleShareLocation} className="flex flex-col items-center gap-1 group">
                           <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                             <MapPin size={20} />
                           </div>
                           <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Location</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hidden Inputs */}
                <input id="upload-document-dm" type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'document')} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
                <input id="upload-camera-dm" type="file" ref={cameraInputRef} onChange={(e) => handleFileUpload(e, 'camera')} className="hidden" accept="image/*" capture="environment" />
                <input id="upload-gallery-dm" type="file" ref={imageInputRef} onChange={(e) => handleFileUpload(e, 'gallery')} className="hidden" accept="image/*" />
                <input id="upload-audio-dm" type="file" ref={audioInputRef} onChange={(e) => handleFileUpload(e, 'audio')} className="hidden" accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac,.wma" />

                {isRecording ? (
                  <div className="flex bg-white items-center justify-between gap-3 flex-1 border border-rose-200 shadow-sm rounded-3xl px-4 py-1.5 h-[44px] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-slate-700">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <button type="button" onClick={cancelRecording} className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-md hover:bg-rose-50">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className={`flex bg-white items-center gap-1 flex-1 border ${editingMessageId || replyingToMessage ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200'} shadow-sm rounded-3xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#00a884]/20 focus-within:border-[#00a884] transition-all`}>
                    <button 
                      type="button" 
                      onClick={() => setEmojiDrawerMessageId('new')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                      title="Add Emoji"
                    >
                      <Smile size={24} />
                    </button>
                    <textarea 
                      value={messageText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMessageText(val);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

                        if (val === '/') {
                          setShowQuickReplyModal(true);
                          setMessageText('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 1024) {
                          e.preventDefault();
                          if (messageText.trim() || pendingAttachment) {
                            handleSendMessage(e as any);
                          }
                        }
                      }}
                      placeholder="Message... Type / for quick replies" 
                      className="flex-1 bg-transparent border-none py-1.5 text-[15px] font-normal text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none resize-none max-h-[120px] min-h-[24px] overflow-y-auto leading-tight"
                      rows={1}
                      style={{ minHeight: '24px' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
                      className={`p-1.5 transition-colors shrink-0 ${showAttachmentMenu ? 'text-indigo-600 bg-indigo-50 rounded-full' : 'text-slate-400 hover:text-indigo-600'}`}
                    >
                      <Paperclip size={20} className="transform -rotate-45" />
                    </button>
                    {!(messageText.trim() || pendingAttachment) && (
                      <button 
                        type="button" 
                        onClick={() => cameraInputRef.current?.click()} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 mr-1"
                        title="Use Camera"
                      >
                        <Camera size={24} />
                      </button>
                    )}
                  </div>
                )}
                {(messageText.trim() || pendingAttachment) ? (
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-12 h-12 shrink-0 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f6f] active:scale-95 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Send size={20} style={{ transform: 'translateX(1px)' }} />
                  </button>
                ) : isRecording ? (
                  <button 
                    type="button"
                    onClick={async () => {
                      const audioBlob = await stopRecording();
                      if (audioBlob) {
                        const file = new File([audioBlob], `Voice Message ${new Date().toLocaleTimeString()}.webm`, { type: 'audio/webm' });
                        setPendingAttachment({
                          name: file.name,
                          type: file.type,
                          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                          url: URL.createObjectURL(file),
                          file: file,
                          source: 'audio'
                        });
                      }
                    }}
                    className="w-12 h-12 shrink-0 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 active:scale-95 transition-all shadow-sm animate-pulse"
                  >
                    <Send size={20} style={{ transform: 'translateX(1px)' }} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={startRecording}
                    className="w-12 h-12 shrink-0 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f6f] active:scale-95 transition-all shadow-sm"
                  >
                    <Mic size={24} />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full relative">
            <button 
              onClick={() => navigate('/direct-messages')}
              className="lg:hidden absolute top-4 left-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium">Loading conversation...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="text-slate-200" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Your Private Messages</h3>
            <p className="text-slate-500 max-w-xs mt-2 text-sm leading-relaxed">
              Select a conversation from the sidebar to view message history and send new messages securely.
            </p>
          </div>
        )}
      </div>
      </div>

      {previewFile && (
        <Modal isOpen={true} onClose={() => setPreviewFile(null)} title="Attachment Viewer">
          <div className="flex flex-col items-center justify-center h-[70vh] bg-black/5 rounded-xl p-4">
            {previewFile.type.startsWith('image/') ? (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain" />
            ) : previewFile.type.startsWith('video/') ? (
              <video src={previewFile.url} controls className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Paperclip size={40} className="text-slate-400 mt-2 ml-2" />
                 </div>
                 <p className="font-bold text-slate-800">{previewFile.name}</p>
                 <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-sm text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                    Download File
                 </a>
              </div>
            )}
          </div>
        </Modal>
      )}

      <CreatePollModal 
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onSubmit={handleSendPoll}
      />

      <CreateEventModal 
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSubmit={handleSendEvent}
      />

      <QuickReplyModal
        isOpen={showQuickReplyModal}
        onClose={() => setShowQuickReplyModal(false)}
        onSelect={(reply) => {
          setMessageText(reply);
          if (inputRef.current) inputRef.current.focus();
        }}
      />

      <Modal isOpen={!!showMessageStatsId} onClose={() => setShowMessageStatsId(null)} title="Message Info">
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            {(() => {
              const msg = activeChatId ? messagesByChat[activeChatId]?.find(m => m.id === showMessageStatsId) : null;
              if (!msg) return null;
              
              return (
                <>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCheck size={20} className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-slate-400'} />
                      <span className="text-sm font-bold text-slate-700 capitalize">{msg.status}</span>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">{msg.time}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirmInfo} onClose={() => setDeleteConfirmInfo(null)} title="Delete Message">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="text-rose-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Delete {deleteConfirmInfo?.type === 'multiple' ? 'Messages' : 'Message'}</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
            Are you sure you want to delete {deleteConfirmInfo?.type === 'multiple' ? 'these messages' : 'this message'}?
          </p>
          <div className="flex flex-col gap-3">
             <button 
               onClick={() => {
                 if (deleteConfirmInfo?.type === 'single' && deleteConfirmInfo.id) {
                   confirmDeleteSingle(deleteConfirmInfo.id, true);
                 } else if (deleteConfirmInfo?.type === 'multiple') {
                   confirmDeleteMultiple(true);
                 }
               }}
               className="w-full py-3.5 bg-rose-600 text-white rounded-xl shadow-sm text-sm font-bold hover:bg-rose-700 transition-colors"
             >
               Delete for Everyone
             </button>
             <button 
               onClick={() => {
                 if (deleteConfirmInfo?.type === 'single' && deleteConfirmInfo.id) {
                   confirmDeleteSingle(deleteConfirmInfo.id, false);
                 } else if (deleteConfirmInfo?.type === 'multiple') {
                   confirmDeleteMultiple(false);
                 }
               }}
               className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors"
             >
               Delete for Me
             </button>
            <button 
              onClick={() => setDeleteConfirmInfo(null)}
              className="w-full py-3.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {activeChat && (
        <Modal isOpen={isChatInfoOpen} onClose={() => setIsChatInfoOpen(false)} title="Contact Info">
          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl font-bold uppercase overflow-hidden mb-4 border-4 border-white shadow-lg">
                {activeChat.user.avatar ? (
                  <img src={activeChat.user.avatar} alt={activeChat.user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  activeChat.user.initials
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{activeChat.user.name}</h2>
              <p className="text-slate-500 font-medium">
                {activeChat.user.status === 'online' ? 'Active Now' : `Last seen ${activeChat.user.lastSeen || 'recently'}`}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors group">
                 <Phone size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                 <span className="text-xs font-bold">Audio</span>
               </button>
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors group">
                 <Video size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                 <span className="text-xs font-bold">Video</span>
               </button>
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors group">
                 <Search size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                 <span className="text-xs font-bold">Search</span>
               </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={isForwardModalOpen} onClose={() => { setIsForwardModalOpen(false); setForwardChatId(''); setForwardContext(''); }} title="Forward Messages">
        <div className="p-4">
           <p className="text-sm text-slate-500 mb-4 px-2">Select a chat to forward {selectedMessages.size} message(s) to:</p>
           <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar">
             {chats.filter(c => c.id !== activeChatId).map(chat => (
               <button
                 key={chat.id}
                 onClick={() => setForwardChatId(chat.id)}
                 className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${forwardChatId === chat.id ? 'bg-indigo-50 border-indigo-200 border' : 'hover:bg-slate-50 border border-transparent'}`}
               >
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                   {chat.user.avatar ? <img src={chat.user.avatar} className="w-full h-full object-cover" /> : chat.user.initials}
                 </div>
                 <div className="text-left flex-1">
                   <h4 className="font-bold text-slate-900">{chat.user.name}</h4>
                   <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                 </div>
                 {forwardChatId === chat.id && <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white"><CheckCheck size={14} /></div>}
               </button>
             ))}
           </div>
           {forwardChatId && (
             <div className="mt-4 flex gap-2">
               <input 
                 type="text" 
                 placeholder="Add a message... (optional)" 
                 value={forwardContext} 
                 onChange={e => setForwardContext(e.target.value)} 
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
               />
               <button 
                 onClick={handleForwardMessage}
                 className="h-10 w-10 shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm hover:bg-indigo-700 transition-colors"
               >
                 <Send size={16} className="ml-1" />
               </button>
             </div>
           )}
        </div>
      </Modal>

      {/* Emoji Bottom Drawer */}
      <AnimatePresence>
        {emojiDrawerMessageId && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEmojiDrawerMessageId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[60vh]"
            >
              <div className="flex-none p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-lg text-slate-900">React with Emoji</h3>
                <button
                  onClick={() => setEmojiDrawerMessageId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {EMOJI_CATEGORIES.map(category => (
                  <div key={category.name}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{category.name}</h4>
                    <div className="flex flex-wrap gap-2">
                       {Array.from(new Set(category.emojis)).map(emoji => (
                         <button
                           key={emoji}
                           onClick={() => {
                             if (emojiDrawerMessageId === 'new') {
                               setMessageText(prev => prev + emoji);
                             } else if (emojiDrawerMessageId) {
                               handleReaction(emojiDrawerMessageId, emoji);
                             }
                             setEmojiDrawerMessageId(null);
                           }}
                           className="text-2xl hover:scale-125 transition-transform p-1 hover:bg-slate-100 rounded-lg"
                         >
                           {emoji}
                         </button>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
