import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Modal from '../components/Modal';
import MessageAttachment from '../components/MessageAttachment';
import PDFPreview from '../components/PDFPreview';
import AudioPlayer from '../components/AudioPlayer';
import CreatePollModal from '../components/CreatePollModal';
import PollMessage from '../components/PollMessage';
import EventMessage, { EventAttachment } from '../components/EventMessage';
import CreateEventModal, { EventDraft } from '../components/CreateEventModal';
import QuickReplyModal from '../components/QuickReplyModal';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
import { 
  Hash, 
  Send, 
  PlusCircle, 
  Smile, 
  AtSign, 
  Download, 
  Info, 
  Phone, 
  MoreVertical,
  Camera,
  Mic,
  Paperclip,
  Search,
  MessageSquare,
  Pin,
  Users,
  FileText,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Loader2,
  Video,
  UserPlus,
  UserCheck,
  Mail,
  Zap,
  X,
  Edit2,
  Reply,
  Forward,
  Trash2,
  CornerDownRight,
  Copy,
  CheckSquare,
  Square,
  Check,
  MoreHorizontal,
  Plus,
  Image as ImageIcon,
  Bell,
  BellOff,
  Eraser,
  Flag,
  LogOut,
  Music,
  BarChart2,
  Calendar,
  MapPin,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDocs, getDoc, setDoc, updateDoc, increment, arrayUnion, deleteDoc, arrayRemove, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface Message {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
    role: string;
  };
  content: string;
  time: string;
  isEdited?: boolean;
  replyTo?: {
    id: string;
    content: string;
    authorName: string;
  };
  rawReactions?: Record<string, string>;
  reactions?: { emoji: string; count: number; reactedByMe: boolean }[];
  deletedBy?: string[];
  attachment?: {
    name: string;
    type: string;
    size: string;
    url: string;
  };
  poll?: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
    allowMultipleAnswers: boolean;
  };
  event?: EventAttachment;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  type?: 'ministry' | 'department' | 'general' | 'announcement' | 'prayer';
  level?: 'global' | 'district' | 'branch';
  targetId?: string | null;
  autoEnroll?: boolean;
  gender?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  unreadCount?: number;
  messagesCount?: number;
  memberIds?: string[];
}

const DEFAULT_CHANNELS: (Omit<Channel, 'id'> & { messagesCount: number })[] = [
  { name: 'general-announcements', description: 'Important announcements and updates.', membersCount: 1, type: 'announcement', level: 'global', autoEnroll: true, messagesCount: 0 },
  { name: 'general-departments', description: 'General discussions for all department members.', membersCount: 1, type: 'department', level: 'global', autoEnroll: true, messagesCount: 0 },
  { name: 'general-ministries', description: 'General discussions for all ministries.', membersCount: 1, type: 'ministry', level: 'global', autoEnroll: true, messagesCount: 0 }
];

interface ChannelMember {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  role: string;
  lastActive: any;
  isTyping?: boolean;
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

export default function MinistryChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMembers, setActiveMembers] = useState<ChannelMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<{name: string, type: string, size: string, url: string, source: string, file?: File} | null>(null);

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
          source: 'location'
        });
      },
      (error) => {
        console.error(error);
        let errorMessage = 'Failed to get location. Provide permissions.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable permissions.';
        }
        toast.error(errorMessage, { id: 'location' });
      }
    );
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [forwardChannelId, setForwardChannelId] = useState('');
  const [forwardComment, setForwardComment] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ type: 'single', id: string } | { type: 'multiple' } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState('general');
  const [newChannelLevel, setNewChannelLevel] = useState('branch');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  
  const [mediaTab, setMediaTab] = useState<'media' | 'links' | 'docs'>('media');
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
  const [emojiDrawerMessageId, setEmojiDrawerMessageId] = useState<string | null>(null);
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionTerm, setMentionTerm] = useState('');
  const [messageStatisticsId, setMessageStatisticsId] = useState<string | null>(null);
  
  const channelMenuRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useAudioRecorder();

  // Auto collapse menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (channelMenuRef.current && !channelMenuRef.current.contains(event.target as Node)) {
        setShowChannelMenu(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Note: we can parse initial from localStorage. We'll useEffect for it later or parse immediately.
  const [readCounts, setReadCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('channelReadCounts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [mutedChannels, setMutedChannels] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('mutedChannels');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');
  const [editChannelType, setEditChannelType] = useState('general');
  const [editChannelLevel, setEditChannelLevel] = useState('branch');
  const [isEditingChannel, setIsEditingChannel] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, type: string, name: string} | null>(null);
  
  const [isBranchExpanded, setIsBranchExpanded] = useState(true);
  const [isDistrictExpanded, setIsDistrictExpanded] = useState(true);
  const [isGlobalExpanded, setIsGlobalExpanded] = useState(true);

  const [inviteSearch, setInviteSearch] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTypingRef = useRef(false);

  const handleRemoveMember = async (memberId: string) => {
    if (!activeChannelId || isAddingMembers) return;
    setIsAddingMembers(true);
    try {
      const memberRef = doc(db, 'ministryChannels', activeChannelId, 'members', memberId);
      await deleteDoc(memberRef);

      const channelRef = doc(db, 'ministryChannels', activeChannelId);
      await updateDoc(channelRef, {
        membersCount: increment(-1),
        memberIds: arrayRemove(memberId)
      });
      
      toast.success('Member removed from channel');
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error('Failed to remove member');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleAddMember = async (targetUser: any) => {
    if (!activeChannelId || isAddingMembers) return;
    setIsAddingMembers(true);
    try {
      // 1. Add to members subcollection
      const memberRef = doc(db, 'ministryChannels', activeChannelId, 'members', targetUser.id);
      const initials = targetUser.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      await setDoc(memberRef, {
        userId: targetUser.id,
        fullName: targetUser.fullName || targetUser.email,
        initials,
        role: targetUser.role || 'Member',
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      // 2. Add to channel memberIds
      const channelRef = doc(db, 'ministryChannels', activeChannelId);
      await updateDoc(channelRef, {
        membersCount: increment(1),
        memberIds: arrayUnion(targetUser.id)
      });
      
      toast.success(`${targetUser.fullName || 'User'} added to channel`);
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error('Failed to add member to channel');
    } finally {
      setIsAddingMembers(false);
    }
  };
  
  const { user, profile } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const isLeader = profile && ['superadmin', 'admin', 'district', 'branch_admin'].includes(profile.role);
  const isAnnouncement = activeChannel?.type === 'announcement';
  const canPost = !isAnnouncement || isLeader;

  // Filter channels the user has access to based on their profile
  const visibleChannels = channels.filter(channel => {
    // Leaders can see all channels
    if (isLeader) return true;

    if (channel.autoEnroll) {
       // Filter by gender if specified
       if (channel.gender && (profile as any)?.gender && channel.gender.toLowerCase() !== (profile as any).gender.toLowerCase()) {
         return false;
       }
       // Filter by level if specified (Branch / District)
       if (channel.level === 'branch' && channel.targetId && channel.targetId !== profile?.branchId) return false;
       if (channel.level === 'district' && channel.targetId && channel.targetId !== profile?.districtId) return false;
       return true;
    } else {
       // Manual enrollment / Invite-only channels
       return channel.memberIds?.includes(user?.uid || '');
    }
  }).map(channel => {
    // Calculate unread count
    const readCount = readCounts[channel.id] || 0;
    const currentMessagesCount = channel.messagesCount || 0;
    const unreadCount = Math.max(0, currentMessagesCount - readCount);
    return { ...channel, unreadCount };
  });

  const branchChannels = visibleChannels.filter(c => c.level === 'branch');
  const districtChannels = visibleChannels.filter(c => c.level === 'district');
  const globalChannels = visibleChannels.filter(c => c.level === 'global' || !c.level);

  // Initialize channels if empty, and subscribe to channels
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(collection(db, 'ministryChannels'), async (snapshot) => {
      try {
        if (snapshot.empty) {
            // Seed default channels
            for (const ch of DEFAULT_CHANNELS) {
              await addDoc(collection(db, 'ministryChannels'), {
                ...ch,
                createdAt: serverTimestamp()
              });
            }
        } else {
            const fetchedChannels = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Channel[];
            
            // Sort by name for consistency
            fetchedChannels.sort((a,b) => a.name.localeCompare(b.name));
            setChannels(fetchedChannels);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'ministryChannels');
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'ministryChannels');
    });
    
    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages in active channel
  useEffect(() => {
    if (!user || !activeChannelId) {
        setMessages([]);
        return;
    }
    
    const messagesRef = collection(db, 'ministryChannels', activeChannelId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
          const fetchedMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
            
            const rawReactions = data.reactions || {};
            const reactionCounts: Record<string, { count: number; reactedByMe: boolean }> = {};
            Object.entries(rawReactions).forEach(([uid, emoji]) => {
               if (typeof emoji === 'string') {
                 if (!reactionCounts[emoji]) reactionCounts[emoji] = { count: 0, reactedByMe: false };
                 reactionCounts[emoji].count++;
                 if (uid === user.uid) {
                   reactionCounts[emoji].reactedByMe = true;
                 }
               }
            });
            const reactions = Object.keys(reactionCounts).map(emoji => ({
               emoji,
               ...reactionCounts[emoji]
            }));

            return {
              id: doc.id,
              author: {
                id: data.authorId || '',
                name: data.authorName || 'Unknown',
                initials: data.authorInitials || '?',
                role: data.authorRole || 'Member',
                avatar: data.authorAvatar
              },
              content: data.content,
              time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isEdited: data.isEdited,
              replyTo: data.replyTo,
              deletedBy: data.deletedBy || [],
              rawReactions,
              reactions,
              attachment: data.attachment,
              poll: data.poll,
              event: data.event
            };
          }) as Message[];
          setMessages(fetchedMessages);
      } catch (error) {
         handleFirestoreError(error, OperationType.LIST, `ministryChannels/${activeChannelId}/messages`);
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `ministryChannels/${activeChannelId}/messages`);
    });
    
    return () => unsubscribe();
  }, [user, activeChannelId]);

  // Subscribe to members in active channel
  useEffect(() => {
    if (!user || !activeChannelId) {
        setActiveMembers([]);
        return;
    }
    
    const membersRef = collection(db, 'ministryChannels', activeChannelId, 'members');
    const q = query(membersRef, orderBy('lastActive', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
          const fetchedMembers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ChannelMember[];
          setActiveMembers(fetchedMembers);
      } catch (error) {
         handleFirestoreError(error, OperationType.LIST, `ministryChannels/${activeChannelId}/members`);
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `ministryChannels/${activeChannelId}/members`);
    });
    
    return () => unsubscribe();
  }, [user, activeChannelId]);

  useEffect(() => {
    if (!selectedProfileId || !user) return;

    const fetchSelectedProfile = async () => {
      try {
        const docRef = doc(db, 'users', selectedProfileId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSelectedProfileData({ id: docSnap.id, ...docSnap.data() });
        }

        // Check if friends
        const friendshipRef = collection(db, 'friendships');
        const q = query(
          friendshipRef,
          where('users', 'array-contains', user.uid)
        );
        const snap = await getDocs(q);
        const friends = snap.docs.some(d => d.data().users.includes(selectedProfileId));
        setIsFriend(friends);
      } catch (error) {
        console.error("Error fetching profile details:", error);
      }
    };

    fetchSelectedProfile();
  }, [selectedProfileId, user]);

  const handleAddFriend = async () => {
    if (!user || !selectedProfileId) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        users: [user.uid, selectedProfileId],
        createdAt: serverTimestamp(),
        status: 'accepted' // Auto-accepting for demo purposes
      });
      setIsFriend(true);
      toast.success('Friend added!');
    } catch (error) {
      toast.error('Failed to add friend');
    }
  };

  useEffect(() => {
    if (!isInviteModalOpen || !isLeader) return;
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('fullName'));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(users);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    };
    fetchUsers();
  }, [isInviteModalOpen, isLeader]);
  useEffect(() => {
    if (!user || !profile || !activeChannelId) return;

    const joinChannel = async () => {
      try {
        const memberRef = doc(db, 'ministryChannels', activeChannelId, 'members', user.uid);
        const memberDoc = await getDoc(memberRef);
        
        const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

        if (!memberDoc.exists()) {
          // Join the channel
          await setDoc(memberRef, {
            userId: user.uid,
            fullName: profile.fullName,
            initials: initials,
            role: profile.role || 'Member',
            joinedAt: serverTimestamp(),
            lastActive: serverTimestamp()
          });

          // Update members count
          const channelRef = doc(db, 'ministryChannels', activeChannelId);
          await updateDoc(channelRef, {
            membersCount: increment(1),
            memberIds: arrayUnion(user.uid)
          });
        } else {
          // Update lastActive
          await updateDoc(memberRef, {
            lastActive: serverTimestamp()
          });
        }
      } catch (error) {
         // Silently fail if rules prevent it, since it's just presence
      }
    };

    joinChannel();
  }, [activeChannelId, user, profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (activeChannelId) {
      const activeChannel = channels.find(c => c.id === activeChannelId);
      if (activeChannel && activeChannel.messagesCount !== undefined) {
        setReadCounts(prev => {
          const newCounts = { ...prev, [activeChannelId]: activeChannel.messagesCount || 0 };
          localStorage.setItem('channelReadCounts', JSON.stringify(newCounts));
          return newCounts;
        });
      }
    }
  }, [activeChannelId, channels]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, source: string = 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check max size (e.g., 20MB for Firebase Storage)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Max size is 20MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';
      return;
    }

    setPendingAttachment({
      name: file.name,
      type: file.type,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      url: URL.createObjectURL(file), // Use object URL for preview
      source,
      file
    });
    setShowAttachmentMenu(false);
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const handleSendPoll = async (pollData: any) => {
    if (!activeChannelId || !user || !profile || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
        const messagesRef = collection(db, 'ministryChannels', activeChannelId, 'messages');
        const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

        // pollData has options: [{id, text}]
        // we need to set votes: []
        const formattedPoll = {
            ...pollData,
            options: pollData.options.map((opt: any) => ({ ...opt, votes: [] }))
        };

        const messageData: any = {
            authorId: user.uid,
            authorName: profile.fullName,
            authorInitials: initials,
            authorRole: profile.role || 'Member',
            authorAvatar: user.photoURL || null,
            content: '',
            poll: formattedPoll,
            createdAt: serverTimestamp()
        };

        await addDoc(messagesRef, messageData);
        await updateDoc(doc(db, 'ministryChannels', activeChannelId), { messagesCount: increment(1) });

        setShowPollModal(false);
    } catch(error: any) {
        toast.error(`Failed to create poll: ${error?.message || 'Unknown error'}`);
        handleFirestoreError(error, OperationType.CREATE, `ministryChannels/${activeChannelId}/messages`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendEvent = async (eventData: EventDraft) => {
    if (!activeChannelId || !user || !profile || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
        const messagesRef = collection(db, 'ministryChannels', activeChannelId, 'messages');
        const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

        const formattedEvent = {
            ...eventData,
            attendees: [user.uid] // Creator auto-attends
        };

        const messageData: any = {
            authorId: user.uid,
            authorName: profile.fullName,
            authorInitials: initials,
            authorRole: profile.role || 'Member',
            authorAvatar: user.photoURL || null,
            content: '',
            event: formattedEvent,
            createdAt: serverTimestamp()
        };

        await addDoc(messagesRef, messageData);
        await updateDoc(doc(db, 'ministryChannels', activeChannelId), { messagesCount: increment(1) });

        setShowEventModal(false);
    } catch(error: any) {
        toast.error(`Failed to create event: ${error?.message || 'Unknown error'}`);
        handleFirestoreError(error, OperationType.CREATE, `ministryChannels/${activeChannelId}/messages`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingAttachment) || !user || !profile || !activeChannelId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const messagesRef = collection(db, 'ministryChannels', activeChannelId, 'messages');
      const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

      if (editingMessageId) {
        const msgRef = doc(db, 'ministryChannels', activeChannelId, 'messages', editingMessageId);
        await updateDoc(msgRef, {
          content: newMessage,
          isEdited: true
        });
        setEditingMessageId(null);
      } else {
        const messageData: any = {
            authorId: user.uid,
            authorName: profile.fullName || user.displayName || 'Unknown User',
            authorInitials: initials || 'U',
            authorRole: profile?.role || 'Member',
            authorAvatar: user.photoURL || null,
            content: newMessage || '',
            createdAt: serverTimestamp()
        };
        
        if (replyingToMessage) {
            messageData.replyTo = {
                id: replyingToMessage.id,
                content: replyingToMessage.content,
                authorName: replyingToMessage.author.name
            };
        }

        if (pendingAttachment) {
            let fileUrl = pendingAttachment.url;
            if (pendingAttachment.source === 'location') {
                // use existing fileUrl, skip storage upload
            } else if (pendingAttachment.file) {
                // Upload to Firebase Storage
                const fileExtension = pendingAttachment.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
                const storageRef = ref(storage, `ministryChannels/${activeChannelId}/${fileName}`);
                
                try {
                    const uploadTask = await uploadBytesResumable(storageRef, pendingAttachment.file);
                    fileUrl = await getDownloadURL(uploadTask.ref);
                } catch (uploadError: any) {
                    console.error("Storage upload error:", uploadError);
                    toast.error(`Firebase Storage Error: ${uploadError?.message || uploadError?.code || 'Unknown'}`);
                    throw new Error(`Firebase Storage Error: ${uploadError?.message || uploadError?.code || 'Unknown'}`);
                }
            }

            messageData.attachment = {
                name: pendingAttachment.name,
                type: pendingAttachment.type,
                size: pendingAttachment.size,
                url: fileUrl
            };
        }

        await addDoc(messagesRef, messageData);
        await updateDoc(doc(db, 'ministryChannels', activeChannelId), { messagesCount: increment(1) });
      }
      setNewMessage('');
      setPendingAttachment(null);
      setReplyingToMessage(null);
    } catch (error: any) {
      toast.error(`Failed to send message: ${error?.message || error}`);
      handleFirestoreError(error, editingMessageId ? OperationType.UPDATE : OperationType.CREATE, `ministryChannels/${activeChannelId}/messages`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTyping = () => {
    if (!activeChannelId || !user) return;
    
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    
    if (!isCurrentlyTypingRef.current) {
        isCurrentlyTypingRef.current = true;
        const memberRef = doc(db, 'ministryChannels', activeChannelId, 'members', user.uid);
        updateDoc(memberRef, { isTyping: true }).catch(() => {});
    }
    
    typingTimeoutRef.current = setTimeout(() => {
        isCurrentlyTypingRef.current = false;
        const memberRef = doc(db, 'ministryChannels', activeChannelId, 'members', user.uid);
        updateDoc(memberRef, { isTyping: false }).catch(() => {});
    }, 2000);
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setNewMessage(msg.content);
    setReplyingToMessage(null);
    inputRef.current?.focus();
  };

  const handleReplyMessage = (msg: Message) => {
    setReplyingToMessage(msg);
    setEditingMessageId(null);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = async (messageId: string) => {
    setDeleteConfirmInfo({ type: 'single', id: messageId });
  };

  const confirmDeleteSingle = async (messageId: string, forEveryone: boolean) => {
    if (!activeChannelId || !user) return;
    try {
      const msgRef = doc(db, 'ministryChannels', activeChannelId, 'messages', messageId);
      const msgObj = messages.find(m => m.id === messageId);
      if (forEveryone && msgObj && msgObj.author.id === user.uid) {
         await deleteDoc(msgRef);
      } else {
         await updateDoc(msgRef, { deletedBy: arrayUnion(user.uid) });
      }
      toast.success('Message deleted');
    } catch (error: any) {
      toast.error(`Failed to delete message: ${error?.message || error}`);
      handleFirestoreError(error, OperationType.DELETE, `ministryChannels/${activeChannelId}/messages/${messageId}`);
    } finally {
      setDeleteConfirmInfo(null);
    }
  };

  const handleCopyMessageText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copied');
    setActiveMessageId(null);
  };

  const handleCopyMessages = () => {
    if (selectedMessages.size === 0) return;
    const text = messages
      .filter(m => selectedMessages.has(m.id))
      .map(m => m.content)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Messages copied to clipboard');
    setIsSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleDeleteSelected = async () => {
    setDeleteConfirmInfo({ type: 'multiple' });
  };

  const handleClearChat = async () => {
    if (!activeChannelId || !user || messages.length === 0) return;
    try {
      const promises = messages.map(msg => {
          const msgRef = doc(db, 'ministryChannels', activeChannelId, 'messages', msg.id);
          if (msg.author.id === user.uid) {
             return deleteDoc(msgRef);
          } else {
             return updateDoc(msgRef, { deletedBy: arrayUnion(user.uid) });
          }
      });
      await Promise.all(promises);
      toast.success('Chat cleared');
    } catch (error: any) {
      toast.error(`Failed to clear chat: ${error?.message || error}`);
    }
  };

  const handleExitChannel = async () => {
    if (!activeChannelId || !user) return;
    try {
      const channelRef = doc(db, 'ministryChannels', activeChannelId);
      await updateDoc(channelRef, {
        memberIds: arrayRemove(user.uid),
        membersCount: increment(-1)
      });
      
      const memberRef = doc(db, 'ministryChannels', activeChannelId, 'members', user.uid);
      await deleteDoc(memberRef);
      
      setActiveChannelId(null);
      toast.success('You have left the channel');
    } catch (error: any) {
      toast.error(`Failed to exit channel: ${error?.message || error}`);
      handleFirestoreError(error, OperationType.DELETE, `ministryChannels/${activeChannelId}`);
    }
  };

  const toggleMute = () => {
    if (!activeChannelId) return;
    const newMuted = new Set(mutedChannels);
    if (newMuted.has(activeChannelId)) {
      newMuted.delete(activeChannelId);
      toast.success('Notifications unmuted');
    } else {
      newMuted.add(activeChannelId);
      toast.success('Notifications muted');
    }
    setMutedChannels(newMuted);
    localStorage.setItem('mutedChannels', JSON.stringify(Array.from(newMuted)));
  };

  const confirmDeleteMultiple = async (forEveryone: boolean) => {
    if (!activeChannelId || !user || selectedMessages.size === 0) return;
    try {
      const promises = Array.from(selectedMessages).map(async (msgId) => {
          const msgObj = messages.find(m => m.id === msgId);
          const msgRef = doc(db, 'ministryChannels', activeChannelId, 'messages', msgId);
          if (forEveryone && msgObj && msgObj.author.id === user.uid) {
             await deleteDoc(msgRef);
          } else {
             await updateDoc(msgRef, { deletedBy: arrayUnion(user.uid) });
          }
      });
      await Promise.all(promises);
      toast.success('Messages deleted');
    } catch (error) {
      toast.error('Failed to delete messages');
    } finally {
      setIsSelectionMode(false);
      setSelectedMessages(new Set());
      setDeleteConfirmInfo(null);
    }
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

  const startForwardMessage = (msg: Message) => {
    setMessageToForward(msg);
    setIsForwardModalOpen(true);
    setForwardChannelId('');
    setForwardComment('');
  };

  const handleForwardMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !messageToForward || !forwardChannelId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const messagesRef = collection(db, 'ministryChannels', forwardChannelId, 'messages');
      const initials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

      const forwardPrefix = `*Forwarded message from ${messageToForward.author.name}:*\n\n`;
      let content = `${forwardPrefix}${messageToForward.content}`;
      if (forwardComment.trim()) {
         content = `${forwardComment}\n\n${content}`;
      }

      const messageData = {
          authorId: user.uid,
          authorName: profile.fullName,
          authorInitials: initials,
          authorRole: profile.role || 'Member',
          authorAvatar: user.photoURL || null,
          content: content,
          createdAt: serverTimestamp()
      };

      await addDoc(messagesRef, messageData);
      await updateDoc(doc(db, 'ministryChannels', forwardChannelId), { messagesCount: increment(1) });
      
      setIsForwardModalOpen(false);
      setMessageToForward(null);
      setForwardComment('');
      setForwardChannelId('');
      toast.success('Message forwarded successfully');
    } catch (error) {
      toast.error('Failed to forward message');
      handleFirestoreError(error, OperationType.CREATE, `ministryChannels/${forwardChannelId}/messages`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (!activeChannel) return;
    setEditChannelName(activeChannel.name || '');
    setEditChannelDescription(activeChannel.description || '');
    setEditChannelType(activeChannel.type || 'general');
    setEditChannelLevel(activeChannel.level || 'branch');
    setIsEditModalOpen(true);
  };

  const handleEditChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannelId || isEditingChannel) return;
    setIsEditingChannel(true);
    try {
      const channelRef = doc(db, 'ministryChannels', activeChannelId);
      await updateDoc(channelRef, {
        name: editChannelName.trim(),
        description: editChannelDescription.trim(),
        type: editChannelType,
        level: editChannelLevel
      });
      toast.success('Channel updated');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update channel');
      handleFirestoreError(error, OperationType.UPDATE, 'ministryChannels');
    } finally {
      setIsEditingChannel(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!activeChannelId) return;
    if (!window.confirm(`Are you sure you want to delete the channel "#${activeChannel?.name}"?`)) return;
    try {
      const channelRef = doc(db, 'ministryChannels', activeChannelId);
      await deleteDoc(channelRef);
      toast.success('Channel deleted');
      setActiveChannelId(null);
      setShowDetails(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete channel');
      handleFirestoreError(error, OperationType.DELETE, 'ministryChannels');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user || !activeChannelId) return;
    try {
      const messageRef = doc(db, 'ministryChannels', activeChannelId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) return;
      
      const data = messageDoc.data();
      const rawReactions = data.reactions || {};
      
      // Toggle reaction
      if (rawReactions[user.uid] === emoji) {
        delete rawReactions[user.uid];
      } else {
        rawReactions[user.uid] = emoji;
      }
      
      await updateDoc(messageRef, {
        reactions: rawReactions
      });
    } catch (error) {
      console.error('Failed to update reaction', error);
      toast.error('Failed to react');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Social Tab Navigation */}
      <div className={`-mx-4 px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 gap-6 md:gap-8 border-b border-slate-200 mb-2 overflow-x-auto no-scrollbar w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChannelId ? 'hidden lg:flex' : 'flex'}`}>
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

      <div className={`flex bg-white lg:rounded-2xl lg:border lg:border-slate-200 shadow-sm overflow-hidden relative -mx-4 md:-mx-6 lg:mx-0 w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChannelId ? 'h-[calc(100vh-100px)] lg:h-[calc(100vh-200px)] border-t border-slate-200 lg:border-t-0' : 'h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)]'}`}>
      {/* Channel Sidebar */}
      <div className={`flex flex-col w-full lg:w-72 lg:border-r border-slate-200 bg-slate-50 ${activeChannelId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-white/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ministry Channels</h3>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <PlusCircle size={16} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Jump to..." 
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
          
          {[
            { id: 'branch', title: 'Branch level', items: branchChannels, isExpanded: isBranchExpanded, toggle: () => setIsBranchExpanded(!isBranchExpanded) },
            { id: 'district', title: 'District level', items: districtChannels, isExpanded: isDistrictExpanded, toggle: () => setIsDistrictExpanded(!isDistrictExpanded) },
            { id: 'global', title: 'Global', items: globalChannels, isExpanded: isGlobalExpanded, toggle: () => setIsGlobalExpanded(!isGlobalExpanded) }
          ].map(({ id, title, items, isExpanded, toggle }) => items.length > 0 && (
            <div key={id}>
              <button 
                onClick={toggle}
                className="w-full flex items-center justify-between px-3 mb-2 mt-4 group cursor-pointer select-none"
              >
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                  {title} ({items.length})
                </h4>
                {isExpanded ? <ChevronDown size={12} className="text-slate-400 group-hover:text-indigo-600 transition-colors" /> : <ChevronRight size={12} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    {items.map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannelId(channel.id)}
                        className={`w-full flex flex-col items-start px-3 py-2.5 rounded-xl transition-all ${
                          activeChannelId === channel.id 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                            : 'bg-white border border-slate-200/50 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Hash size={14} className={`flex-shrink-0 ${activeChannelId === channel.id ? 'text-indigo-200' : 'text-slate-400'}`} />
                            <span className={`text-sm truncate flex items-center gap-1.5 min-w-0 ${activeChannelId === channel.id ? 'text-white font-bold' : (channel.unreadCount && channel.unreadCount > 0 ? 'text-slate-900 font-black' : 'text-slate-700 font-medium')}`}>
                              <span className="truncate">{channel.name}</span>
                              {channel.level && <span className={`flex-shrink-0 text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-sm ${activeChannelId === channel.id ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 text-slate-500'}`}>{channel.level}</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`flex items-center gap-1 text-[10px] font-bold ${activeChannelId === channel.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                              <Users size={10} />
                              {channel.membersCount || 0}
                            </div>
                            {(channel.unreadCount ?? 0) > 0 && activeChannelId !== channel.id && (
                              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 rounded-full min-w-[20px] text-center">
                                {channel.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        {channel.description && (
                          <p className={`text-[10px] font-medium leading-relaxed line-clamp-1 w-full text-left ${activeChannelId === channel.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                             {channel.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex-col min-w-0 bg-[#efeae2] ${activeChannelId ? 'flex' : 'hidden lg:flex'}`}>
        {activeChannel ? (
          <>
        {/* Chat Header */}
        <div className="h-16 px-4 lg:px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 relative z-10 transition-colors">
          {isSelectionMode ? (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsSelectionMode(false); setSelectedMessages(new Set()); }} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <span className="font-bold text-slate-700 text-sm">{selectedMessages.size} selected</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 relative z-20">
                 <button onClick={() => {
                   if (selectedMessages.size === 1) {
                     const msg = messages.find(m => selectedMessages.has(m.id));
                     if (msg) {
                       handleReplyMessage(msg);
                       setIsSelectionMode(false);
                       setSelectedMessages(new Set());
                     }
                   }
                 }} disabled={selectedMessages.size !== 1} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors" title="Reply">
                    <Reply size={18} />
                 </button>
                 <button onClick={() => { 
                   if (selectedMessages.size === 1) {
                     const msg = messages.find(m => selectedMessages.has(m.id));
                     if (msg) startForwardMessage(msg);
                   } else {
                     toast.info('Forwarding multiple messages not supported yet');
                   }
                 }} disabled={selectedMessages.size !== 1} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors" title="Forward">
                    <Forward size={18} />
                 </button>
                 <button onClick={handleCopyMessages} disabled={selectedMessages.size === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors" title="Copy">
                    <Copy size={18} />
                 </button>
                 <button onClick={handleDeleteSelected} disabled={selectedMessages.size === 0} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full disabled:opacity-50 transition-colors" title="Delete">
                    <Trash2 size={18} />
                 </button>
                 <div className="relative">
                   <button onClick={() => setShowSelectionMenu(!showSelectionMenu)} disabled={selectedMessages.size === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors" title="More">
                      <MoreVertical size={18} />
                   </button>
                   {showSelectionMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50">
                         <div className="py-1 flex flex-col">
                           {selectedMessages.size === 1 && messages.find(m => selectedMessages.has(m.id))?.author?.id === user?.uid && (
                             <>
                               <button onClick={() => {
                                 const msg = messages.find(m => selectedMessages.has(m.id));
                                 if (msg) {
                                   setMessageStatisticsId(msg.id);
                                   setIsSelectionMode(false);
                                   setSelectedMessages(new Set());
                                   setShowSelectionMenu(false);
                                 }
                               }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                 <Info size={16} /> Message Info
                               </button>
                               <button onClick={() => {
                                 const msg = messages.find(m => selectedMessages.has(m.id));
                                 if (msg) {
                                   handleEditMessage(msg);
                                   setIsSelectionMode(false);
                                   setSelectedMessages(new Set());
                                   setShowSelectionMenu(false);
                                 }
                               }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                 <Edit2 size={16} /> Edit Message
                               </button>
                             </>
                           )}
                         </div>
                      </div>
                   )}
                 </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 lg:gap-3">
                <button 
                  onClick={() => setActiveChannelId(null)}
                  className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="hidden lg:block p-2 text-slate-400">
                   <Hash size={20} />
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 leading-none flex items-center gap-2">
                    #{activeChannel?.name}
                    {activeChannel?.level && (
                      <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {activeChannel.level}
                      </span>
                    )}
                  </h1>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 truncate max-w-xs md:max-w-md">
                    {activeChannel?.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 relative z-20">
                <button type="button" className="hidden sm:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <Phone size={18} />
                </button>
                <div className="relative" ref={channelMenuRef}>
                  <button 
                    type="button"
                    onClick={() => setShowChannelMenu(!showChannelMenu)}
                    className={`p-2 rounded-lg transition-all ${showChannelMenu ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showChannelMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50">
                      <div className="py-1 flex flex-col">
                        <button
                           onClick={() => { setShowDetails(!showDetails); setShowChannelMenu(false); }}
                           className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-3 ${showDetails ? 'text-indigo-600' : 'text-slate-700'}`}
                        >
                           <Info size={16} /> Channel Details
                        </button>
                        <button
                           onClick={() => { setIsSearchingChannel(true); setShowChannelMenu(false); }}
                           className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                           <Search size={16} /> Search Channel
                        </button>
                        <button
                           onClick={() => { toggleMute(); setShowChannelMenu(false); }}
                           className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                           {mutedChannels.has(activeChannelId!) ? <Bell size={16} /> : <BellOff size={16} />}
                           <span>{mutedChannels.has(activeChannelId!) ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                        </button>
                        <button
                           onClick={() => { handleClearChat(); setShowChannelMenu(false); }}
                           className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                           <Eraser size={16} /> Clear Chat
                        </button>
                        <button
                           onClick={() => { setShowReportModal(true); setShowChannelMenu(false); }}
                           className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                           <Flag size={16} /> Report Channel
                        </button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button
                           onClick={() => { handleExitChannel(); setShowChannelMenu(false); }}
                           className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3"
                        >
                           <LogOut size={16} /> Exit Channel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search Channel Input */}
        <AnimatePresence>
          {isSearchingChannel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-slate-100 bg-white px-6 py-2 flex items-center gap-2"
            >
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search in conversation..."
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 min-w-0"
                autoFocus
              />
              <button onClick={() => { setIsSearchingChannel(false); setChannelSearchQuery(''); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30"
        >
          <div className="flex items-center gap-4 my-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Today</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <AnimatePresence initial={false}>
            {messages.filter(msg => {
                if (user && msg.deletedBy?.includes(user.uid)) return false;
                if (isSearchingChannel && channelSearchQuery.trim() !== '') {
                  return msg.content.toLowerCase().includes(channelSearchQuery.toLowerCase());
                }
                return true;
            }).map((msg) => {
              const isMe = msg.author.id === user?.uid;
              const isSelected = selectedMessages.has(msg.id);
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  drag={!isSelectionMode ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0, right: 0.15 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 60) {
                      handleReplyMessage(msg);
                    }
                  }}
                  onClick={() => {
                    if (isSelectionMode) {
                       toggleMessageSelection(msg.id);
                    }
                  }}
                  onTouchStart={() => {
                    if (isSelectionMode) return;
                    longPressTimer.current = setTimeout(() => {
                      setIsSelectionMode(true);
                      toggleMessageSelection(msg.id);
                    }, 500);
                  }}
                  onTouchEnd={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  onTouchMove={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  onMouseDown={() => {
                    if (isSelectionMode) return;
                    longPressTimer.current = setTimeout(() => {
                      setIsSelectionMode(true);
                      toggleMessageSelection(msg.id);
                    }, 500);
                  }}
                  onMouseUp={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  onMouseLeave={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  className={`flex gap-3 group px-2 py-1 -mx-2 rounded-lg transition-colors ${isMe ? 'flex-row-reverse' : ''} ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : isSelectionMode ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                  <button 
                    type="button"
                    onClick={(e) => {
                      if (isSelectionMode) return;
                      e.stopPropagation();
                      if (msg.author.avatar) setPreviewFile({url: msg.author.avatar, type: 'image/jpeg', name: msg.author.name});
                    }}
                    className={`w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600 font-bold shrink-0 overflow-hidden hover:scale-110 active:scale-95 transition-transform flex ${msg.author.avatar ? 'cursor-zoom-in' : 'cursor-default'}`}
                  >
                    {msg.author.avatar ? (
                      <img src={msg.author.avatar} alt={msg.author.name} className="w-full h-full object-cover" />
                    ) : (
                      msg.author.initials
                    )}
                  </button>
                  <div className={`flex-1 min-w-0 group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                    <div 
                      onClick={() => !isSelectionMode && setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                      className={`${isMe ? 'bg-indigo-600 border-indigo-500 rounded-tr-none' : 'bg-white border-slate-100 rounded-tl-none'} px-4 py-2.5 pb-1.5 rounded-2xl shadow-sm inline-block max-w-[90%] break-words whitespace-pre-wrap relative min-w-[100px] cursor-pointer lg:cursor-default`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProfileId(msg.author.id);
                          }}
                          className={`text-[10px] font-black uppercase tracking-widest hover:underline text-left transition-colors ${isMe ? 'text-indigo-200' : 'text-indigo-600'}`}
                        >
                          {msg.author.name}
                        </button>
                      </div>
                      {msg.replyTo && (
                        <div className={`mb-1.5 pl-2 border-l-2 rounded-sm p-1.5 text-xs ${isMe ? 'border-indigo-300 bg-indigo-700/50 flex-row-reverse' : 'border-slate-300 bg-slate-50'}`}>
                          <p className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-indigo-200 flex flex-row-reverse' : 'text-slate-500'}`}>{msg.replyTo.authorName}</p>
                          <p className={`truncate ${isMe ? 'text-indigo-50 flex flex-row-reverse' : 'text-slate-600'}`}>{msg.replyTo.content}</p>
                        </div>
                      )}

                      {/* Attachment Inside Bubble */}
                      {msg.attachment && (
                        <MessageAttachment attachment={msg.attachment} isMe={isMe} setPreviewFile={setPreviewFile} />
                      )}
                      
                      {/* Poll Inside Bubble */}
                      {msg.poll && (
                        <PollMessage 
                           poll={msg.poll} 
                           messageId={msg.id} 
                           chatId={activeChannelId!} 
                           currentUserId={user!.uid} 
                        />
                      )}

                      {/* Event Inside Bubble */}
                      {msg.event && (
                        <EventMessage 
                           event={msg.event} 
                           messageId={msg.id} 
                           chatId={activeChannelId!} 
                           currentUserId={user!.uid} 
                        />
                      )}

                      {msg.content && (
                        <p className={`text-[14px] leading-relaxed mb-1 ${isMe ? 'text-white text-right' : 'text-slate-800 text-left'}`}>
                          {profile?.fullName && msg.content.includes(`@${profile.fullName}`) ? (
                             msg.content.split(`@${profile.fullName}`).map((part, i, arr) => (
                                <React.Fragment key={i}>
                                   {part}
                                   {i < arr.length - 1 && (
                                      <span className={`font-bold px-1.5 py-0.5 rounded-md ${isMe ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>@{profile.fullName}</span>
                                   )}
                                </React.Fragment>
                             ))
                          ) : (
                             msg.content
                          )}
                        </p>
                      )}
                      
                      <div className={`flex items-center gap-1.5 ${isMe ? 'justify-start' : 'justify-end'}`}>
                        {msg.isEdited && <span className={`text-[8px] font-bold uppercase tracking-widest ${isMe ? 'text-indigo-300' : 'text-slate-300'}`}>Edited</span>}
                        <span className={`text-[9px] font-bold uppercase tracking-tight ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</span>
                      </div>
                      
                      {/* Quick Reaction Picker & Action Buttons */}
                      <div className={`absolute -top-12 lg:-top-2 ${activeMessageId === msg.id ? 'opacity-100 scale-100 z-20 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none lg:pointer-events-auto'} lg:group-hover:opacity-100 lg:group-hover:scale-100 transition-all duration-200 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-1.5 lg:py-1 shadow-lg lg:shadow-sm ${isMe ? 'right-0 lg:-left-2 lg:right-auto' : 'left-0 lg:-right-2 lg:left-auto'} min-w-max`}>
                         {['👍', '❤️', '🙏', '🔥'].map(emoji => (
                           <button
                             key={emoji}
                             onClick={(e) => {
                               e.stopPropagation();
                               handleReaction(msg.id, emoji);
                               setActiveMessageId(null);
                             }}
                             className="hover:scale-125 transition-transform text-xs lg:text-sm p-1"
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
                      </div>
                    </div>

                    {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.reactions.map((r, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleReaction(msg.id, r.emoji)}
                          className={`flex items-center gap-1.5 border rounded-full px-2 py-0.5 transition-all text-xs ${
                            r.reactedByMe ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span className={`text-[10px] font-black ${r.reactedByMe ? 'text-indigo-600' : 'text-slate-500'}`}>{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        {canPost ? (
        <div className="p-2 md:p-3 bg-transparent mt-auto shrink-0 w-full border-t-0">
          {(replyingToMessage || editingMessageId) && (
             <div className="mb-2 mx-2 px-3 py-2 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg flex justify-between items-center text-sm shadow-sm">
                <div className="flex flex-col truncate">
                   <span className="font-bold text-indigo-700 text-xs uppercase tracking-widest">{editingMessageId ? 'Editing Message' : `Replying to ${replyingToMessage?.author.name}`}</span>
                   <span className="text-slate-600 truncate">{editingMessageId ? newMessage : replyingToMessage?.content}</span>
                </div>
                <button 
                  type="button" 
                  title="Cancel"
                  onClick={() => {
                     setEditingMessageId(null);
                     setReplyingToMessage(null);
                     if (editingMessageId) setNewMessage('');
                  }} 
                  className="p-1 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors"
                >
                  <X size={16} />
                </button>
             </div>
          )}

          {activeMembers.filter(m => m.isTyping && m.userId !== user?.uid).length > 0 && (
             <div className="px-4 py-1 text-xs text-indigo-500 font-medium animate-pulse flex items-center gap-2">
                <div className="flex gap-1">
                   <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {activeMembers.filter(m => m.isTyping && m.userId !== user?.uid)
                               .map(m => m.fullName.split(' ')[0])
                               .join(', ')} is typing...
             </div>
          )}

          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 w-full max-w-full relative"
          >
            {/* Attachment Menu Popover */}
            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div 
                  ref={attachmentMenuRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-12 mb-2 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 origin-bottom-right"
                >
                  <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                    <label htmlFor="upload-document" className="flex flex-col items-center gap-1 group cursor-pointer">
                       <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                         <FileText size={20} />
                       </div>
                       <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Document</span>
                    </label>
                    <label htmlFor="upload-camera" className="flex flex-col items-center gap-1 group cursor-pointer">
                       <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                         <Camera size={20} />
                       </div>
                       <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Camera</span>
                    </label>
                    <label htmlFor="upload-gallery" className="flex flex-col items-center gap-1 group cursor-pointer">
                       <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                         <ImageIcon size={20} />
                       </div>
                       <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Gallery</span>
                    </label>
                    <label htmlFor="upload-audio" className="flex flex-col items-center gap-1 group cursor-pointer">
                       <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                         <Music size={20} />
                       </div>
                       <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Audio</span>
                    </label>
                    <button type="button" onClick={() => { setNewMessage('/'); setShowQuickReplyModal(true); setShowAttachmentMenu(false); }} className="flex flex-col items-center gap-1 group">
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

            {/* Hidden Intputs */}
            <input id="upload-document" type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'document')} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
            <input id="upload-gallery" type="file" ref={imageInputRef} onChange={(e) => handleFileUpload(e, 'gallery')} className="hidden" accept="image/*" />
            <input id="upload-camera" type="file" ref={cameraInputRef} onChange={(e) => handleFileUpload(e, 'camera')} className="hidden" accept="image/*" capture="environment" />
            <input id="upload-audio" type="file" ref={audioInputRef} onChange={(e) => handleFileUpload(e, 'audio')} className="hidden" accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac,.wma" />

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
              <div className={`flex bg-white items-center gap-1 flex-1 border ${editingMessageId || replyingToMessage ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200'} shadow-sm rounded-3xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all`}>
                <button 
                  type="button" 
                  onClick={() => setEmojiDrawerMessageId('new')}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0" 
                  title="Add Emoji"
                >
                  <Smile size={24} />
                </button>

                {showMentions && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20">
                     <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                       Mention a member
                     </div>
                     <div className="max-h-48 overflow-y-auto p-1">
                        {activeMembers.filter(m => m.fullName.toLowerCase().includes(mentionTerm.toLowerCase())).length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500 font-medium">No members found</div>
                        ) : (
                            activeMembers.filter(m => m.fullName.toLowerCase().includes(mentionTerm.toLowerCase())).map(member => (
                               <button 
                                  key={member.userId}
                                  type="button"
                                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                                  onClick={() => {
                                      const textBeforeMention = newMessage.slice(0, inputRef.current?.selectionStart || newMessage.length).replace(/@(\w*)$/, '');
                                      const textAfterCursor = newMessage.slice(inputRef.current?.selectionStart || newMessage.length);
                                      setNewMessage(`${textBeforeMention}@${member.fullName} ${textAfterCursor}`);
                                      setShowMentions(false);
                                      setTimeout(() => inputRef.current?.focus(), 0);
                                  }}
                               >
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                      {member.initials}
                                  </div>
                                  <span className="text-sm font-bold truncate">{member.fullName}</span>
                               </button>
                            ))
                        )}
                     </div>
                  </div>
                )}

                <textarea 
                  ref={inputRef as any}
                  value={newMessage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewMessage(val);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    handleTyping();

                    if (val === '/') {
                      setShowQuickReplyModal(true);
                      setNewMessage('');
                      return;
                    }

                    const cursorPosition = e.target.selectionStart;
                    const textBeforeCursor = val.slice(0, cursorPosition);
                    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
                    
                    if (mentionMatch) {
                      setShowMentions(true);
                      setMentionTerm(mentionMatch[1]);
                    } else {
                      setShowMentions(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 1024) {
                      e.preventDefault();
                      if (newMessage.trim() || pendingAttachment) {
                        handleSendMessage(e as any);
                      }
                    }
                  }}
                  placeholder={`Message #${activeChannel?.name}... Type / for quick replies`}
                  className="flex-1 bg-transparent border-none py-1.5 text-[15px] font-normal text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none resize-none max-h-[120px] min-h-[24px] overflow-y-auto leading-tight"
                  rows={1}
                  style={{ minHeight: '24px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`p-1.5 transition-colors shrink-0 ${showAttachmentMenu ? 'text-indigo-600 bg-indigo-50 rounded-full' : 'text-slate-400 hover:text-indigo-600'}`} 
                  title="Attach file"
                >
                  <Paperclip size={20} className="transform -rotate-45" />
                </button>
                {!(newMessage.trim() || pendingAttachment) && (
                  <button 
                    type="button" 
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 mr-1"
                    title="Take photo"
                  >
                    <Camera size={24} />
                  </button>
                )}
              </div>
            )}
            {(newMessage.trim() || pendingAttachment) ? (
              <button 
                type="submit"
                className="w-12 h-12 shrink-0 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f6f] active:scale-95 transition-all shadow-sm"
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
        ) : (
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-sm font-medium text-slate-500">
            Only channel admins can send messages to this channel.
          </div>
        )}
        </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
            <div className="w-20 h-20 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center mb-6">
              <Hash className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Ministry Channels</h3>
            <p className="text-slate-500 max-w-xs mt-2 text-sm leading-relaxed">
              Select a channel from the sidebar to view conversations.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar Details */}
      <AnimatePresence>
        {showDetails && activeChannel && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: window.innerWidth < 1024 ? window.innerWidth : 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col bg-white border-l border-slate-200 overflow-y-auto absolute lg:static inset-y-0 right-0 z-50 lg:z-auto shadow-2xl lg:shadow-none"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Details</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDetails(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                   <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* About */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info size={12} /> About Channel
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {activeChannel?.description}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ImageIcon size={12} /> Media, Links & Docs
                </h4>
                <div className="space-y-4">
                  <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <button
                      onClick={() => setMediaTab('media')}
                      className={`flex-1 text-xs font-bold uppercase tracking-widest py-2 rounded-md transition-colors ${mediaTab === 'media' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Media
                    </button>
                    <button
                      onClick={() => setMediaTab('links')}
                      className={`flex-1 text-xs font-bold uppercase tracking-widest py-2 rounded-md transition-colors ${mediaTab === 'links' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Links
                    </button>
                    <button
                      onClick={() => setMediaTab('docs')}
                      className={`flex-1 text-xs font-bold uppercase tracking-widest py-2 rounded-md transition-colors ${mediaTab === 'docs' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Docs
                    </button>
                  </div>
                  
                  <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                    {mediaTab === 'media' && (
                      <div className="grid grid-cols-3 gap-2">
                        {messages.filter(msg => msg.attachment && msg.attachment.name.match(/\.(jpeg|jpg|gif|png)$/i)).length > 0 ? (
                           messages.filter(msg => msg.attachment && msg.attachment.name.match(/\.(jpeg|jpg|gif|png)$/i)).map(msg => (
                             <div key={msg.id} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group cursor-pointer" onClick={() => {
                               if (msg.attachment && msg.attachment.url) {
                                 setPreviewFile({
                                   url: msg.attachment.url,
                                   type: msg.attachment.type,
                                   name: msg.attachment.name
                                 });
                               }
                             }}>
                               <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                  {msg.attachment?.url ? (
                                    <img src={msg.attachment.url} alt="thumbnail" className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon size={24} />
                                  )}
                               </div>
                             </div>
                           ))
                        ) : (
                           <div className="col-span-3 text-center py-8 text-slate-500 text-sm">No media found in this channel.</div>
                        )}
                      </div>
                    )}
                    {mediaTab === 'links' && (
                      <div className="space-y-2">
                        {messages.filter(msg => msg.content.match(/https?:\/\/[^\s]+/)).length > 0 ? (
                           messages.filter(msg => msg.content.match(/https?:\/\/[^\s]+/)).map(msg => {
                             const urls = msg.content.match(/https?:\/\/[^\s]+/g);
                             return urls?.map((url, i) => (
                               <a key={`${msg.id}-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                                 <p className="text-sm text-indigo-600 truncate">{url}</p>
                                 <p className="text-xs text-slate-400 mt-1 line-clamp-1">{msg.content}</p>
                               </a>
                             ));
                           })
                        ) : (
                           <div className="text-center py-8 text-slate-500 text-sm">No links found in this channel.</div>
                        )}
                      </div>
                    )}
                    {mediaTab === 'docs' && (
                      <div className="space-y-2">
                        {messages.filter(msg => msg.attachment && !msg.attachment.name.match(/\.(jpeg|jpg|gif|png)$/i)).length > 0 ? (
                           messages.filter(msg => msg.attachment && !msg.attachment.name.match(/\.(jpeg|jpg|gif|png)$/i)).map(msg => (
                             <button key={msg.id} onClick={() => {
                               if (msg.attachment?.url) {
                                 window.open(msg.attachment.url, '_blank');
                               }
                             }} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                               <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center shrink-0">
                                 📄
                               </div>
                               <div className="min-w-0 flex-1">
                                 <p className="text-sm font-medium text-slate-700 truncate">{msg.attachment?.name || 'Document'}</p>
                                 <p className="text-xs text-slate-400 mt-0.5">{msg.time}</p>
                               </div>
                             </button>
                           ))
                        ) : (
                           <div className="text-center py-8 text-slate-500 text-sm">No documents found in this channel.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Members */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} /> Members ({activeChannel?.membersCount})
                  </h4>
                  <div className="flex gap-2">
                    {isLeader && (
                      <button onClick={() => setIsInviteModalOpen(true)} className="text-[10px] font-black text-indigo-600 hover:underline">
                        Add Members
                      </button>
                    )}
                    <button className="text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:underline">View All</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {activeMembers.length > 0 ? (
                    activeMembers.slice(0, 10).map((m) => (
                      <div key={m.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            {m.initials}
                          </div>
                          {m.lastActive && (new Date().getTime() - m.lastActive.toDate().getTime()) < 5 * 60 * 1000 && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center w-full">
                            <p className="text-xs font-bold text-slate-900 leading-none truncate">{m.fullName}</p>
                            {isLeader && m.userId !== user?.uid && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.userId); }}
                                className="text-[10px] uppercase font-black tracking-widest text-slate-300 hover:text-rose-500 transition-colors ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{m.role}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">No members found.</p>
                  )}
                </div>
              </div>

              {/* Pinned */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Pin size={12} /> Pinned Items
                </h4>
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                   <p className="text-[10px] text-amber-700 font-bold mb-1">Upcoming Revival Practice</p>
                   <p className="text-[10px] text-amber-600/70 font-medium leading-relaxed">Thursday @ 7pm - Main Sanctuary. Attendance is mandatory for all leads.</p>
                </div>
              </div>

              {/* Admin Settings */}
              {isLeader && (
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Settings
                  </h4>
                  <div className="space-y-2">
                    <button 
                      onClick={openEditModal}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Edit Channel
                    </button>
                    <button 
                      onClick={handleDeleteChannel}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      Delete Channel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

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
                               setNewMessage(prev => prev + emoji);
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

      {/* Invite Members Modal */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Manage Members">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search users to add..."
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-2 no-scrollbar border border-slate-100 rounded-xl p-2 bg-slate-50">
            {allUsers
              .filter(u => u.id !== user?.uid) // Exclude current user
              .filter(u => !activeMembers.some(am => am.id === u.id)) // Exclude already members
              .filter(u => (u.fullName || u.email || '').toLowerCase().includes(inviteSearch.toLowerCase()))
              .slice(0, 15) // Limit just for demo
              .map(targetUser => (
              <div key={targetUser.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {targetUser.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{targetUser.fullName || targetUser.email}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{targetUser.role || 'Member'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isAddingMembers}
                  onClick={() => handleAddMember(targetUser)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ))}
            {allUsers.length > 0 && 
             allUsers.filter(u => u.id !== user?.uid && !activeMembers.some(am => am.id === u.id) && (u.fullName || u.email || '').toLowerCase().includes(inviteSearch.toLowerCase())).length === 0 && (
              <div className="p-4 text-center text-sm font-medium text-slate-500">
                No new users found matching your search.
              </div>
            )}
            {allUsers.length === 0 && (
              <div className="p-4 text-center text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                Loading users...
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Create Channel Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => !isCreatingChannel && setIsCreateModalOpen(false)} title="Create Ministry Channel">
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newChannelName.trim() || !newChannelDescription.trim() || isCreatingChannel) return;
            
            setIsCreatingChannel(true);
            try {
              const formattedName = newChannelName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
              const docRef = await addDoc(collection(db, 'ministryChannels'), {
                name: formattedName,
                description: newChannelDescription.trim(),
                membersCount: 1, // Just the creator to start
                messagesCount: 0,
                memberIds: [user?.uid], // Add the creator to memberIds
                type: newChannelType,
                level: newChannelLevel,
                targetId: (newChannelLevel === 'branch' ? profile?.branchId : (newChannelLevel === 'district' ? profile?.districtId : null)) ?? null,
                autoEnroll: false, // Default manual enrollment for custom channels 
                createdAt: serverTimestamp()
              });
              
              // Also add to the members subcollection so user shows up in the Members sidebar
              if (user && profile) {
                const memberRef = doc(db, 'ministryChannels', docRef.id, 'members', user.uid);
                await setDoc(memberRef, {
                  userId: user.uid,
                  fullName: profile.fullName,
                  initials: profile.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U',
                  role: profile.role || 'Member',
                  joinedAt: serverTimestamp(),
                  lastActive: serverTimestamp()
                });
              }

              toast.success('Channel created successfully');
              setIsCreateModalOpen(false);
              setNewChannelName('');
              setNewChannelDescription('');
              setNewChannelType('general');
              setNewChannelLevel('branch');
              setActiveChannelId(docRef.id);
            } catch (error) {
              toast.error('Failed to create channel');
              handleFirestoreError(error, OperationType.CREATE, 'ministryChannels');
            } finally {
              setIsCreatingChannel(false);
            }
          }}
          className="space-y-4 pt-4"
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
              <select
                value={newChannelType}
                onChange={e => setNewChannelType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium"
              >
                <option value="general">General</option>
                <option value="ministry">Ministry</option>
                <option value="department">Department</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Level</label>
              <select
                value={newChannelLevel}
                onChange={e => setNewChannelLevel(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium"
              >
                <option value="branch">Branch</option>
                <option value="district">District</option>
                <option value="global">Global</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Channel Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">#</span>
              <input 
                type="text" 
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="youth-ministry"
                className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea 
              value={newChannelDescription}
              onChange={e => setNewChannelDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium resize-none min-h-[100px]"
              required
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button 
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreatingChannel}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isCreatingChannel || !newChannelName.trim() || !newChannelDescription.trim()}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isCreatingChannel ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Channel Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => !isEditingChannel && setIsEditModalOpen(false)} title="Edit Ministry Channel">
        <form onSubmit={handleEditChannel} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Channel Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">#</span>
              <input 
                type="text" 
                value={editChannelName}
                onChange={(e) => setEditChannelName(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                placeholder="e.g. general-announcements"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Description</label>
            <textarea 
              value={editChannelDescription}
              onChange={(e) => setEditChannelDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
              placeholder="What is this channel about?"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Channel Type</label>
            <select 
              value={editChannelType}
              onChange={(e) => setEditChannelType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all appearance-none"
            >
              <option value="general">General Chat</option>
              <option value="announcement">Announcements (Read-only for members)</option>
              <option value="prayer">Prayer Requests</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Channel Level</label>
            <select 
              value={editChannelLevel}
              onChange={(e) => setEditChannelLevel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all appearance-none"
            >
              {(profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'branch_admin') && (
                <>
                  <option value="global">Global (Whole Church)</option>
                  <option value="district">District Level</option>
                </>
              )}
              <option value="branch">Branch Level</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button 
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditingChannel}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isEditingChannel || !editChannelName.trim() || !editChannelDescription.trim()}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isEditingChannel ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Forward Message Modal */}
      <Modal isOpen={isForwardModalOpen} onClose={() => !isSubmitting && setIsForwardModalOpen(false)} title="Forward Message">
        <form onSubmit={handleForwardMessage} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Forward to Channel</label>
            <select
              value={forwardChannelId}
              onChange={(e) => setForwardChannelId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all appearance-none"
              required
            >
              <option value="">Select a channel...</option>
              {channels.filter(c => c.id !== activeChannelId).map(c => (
                <option key={c.id} value={c.id}># {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Message Context</label>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 mb-4 truncate text-left relative overflow-hidden">
                <span className="font-bold text-slate-800">{messageToForward?.author.name}:</span> {messageToForward?.content}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Add a comment (optional)</label>
            <textarea 
              value={forwardComment}
              onChange={(e) => setForwardComment(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all h-24 resize-none"
              placeholder="Type your comment..."
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button 
              type="button"
              onClick={() => setIsForwardModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !forwardChannelId}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Forward size={16} />}
              {isSubmitting ? 'Forwarding...' : 'Forward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmInfo} onClose={() => setDeleteConfirmInfo(null)} title="Delete Message">
        <div className="space-y-4">
          <p className="text-slate-600">
            {deleteConfirmInfo?.type === 'single' 
              ? 'Are you sure you want to delete this message?' 
              : `Are you sure you want to delete ${selectedMessages.size} messages?`}
          </p>
          <div className="flex flex-col gap-2 pt-4">
            {(() => {
              const canDeleteForEveryone = deleteConfirmInfo 
                ? (deleteConfirmInfo.type === 'single'
                   ? messages.find(m => m.id === deleteConfirmInfo.id)?.author.id === user?.uid
                   : Array.from(selectedMessages).some(id => messages.find(m => m.id === id)?.author.id === user?.uid))
                : false;
                
              return (
                <>
                  {canDeleteForEveryone && (
                    <button 
                      onClick={() => {
                        if (deleteConfirmInfo?.type === 'single') confirmDeleteSingle(deleteConfirmInfo.id, true);
                        if (deleteConfirmInfo?.type === 'multiple') confirmDeleteMultiple(true);
                      }}
                      className="w-full px-6 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete for Everyone
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (deleteConfirmInfo?.type === 'single') confirmDeleteSingle(deleteConfirmInfo.id, false);
                      if (deleteConfirmInfo?.type === 'multiple') confirmDeleteMultiple(false);
                    }}
                    className={`w-full px-6 py-2.5 ${canDeleteForEveryone ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'} text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2`}
                  >
                    {canDeleteForEveryone ? null : <Trash2 size={16} />}
                    Delete for Me
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmInfo(null)}
                    className="w-full px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mt-2"
                  >
                    Cancel
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </Modal>

      {/* Profile Detail Drawer (Responsive) */}
      <AnimatePresence>
        {selectedProfileId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfileId(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            
            <motion.div 
              initial={window.innerWidth < 1024 ? { y: '100%' } : { x: '100%' }}
              animate={window.innerWidth < 1024 ? { y: 0 } : { x: 0 }}
              exit={window.innerWidth < 1024 ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 lg:bottom-0 lg:top-0 lg:right-0 lg:left-auto lg:w-[400px] h-[85vh] lg:h-full bg-white z-[110] shadow-2xl rounded-t-[40px] lg:rounded-t-none lg:rounded-l-[40px] flex flex-col overflow-hidden"
            >
              <div className="lg:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
              
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-4 lg:pt-12">
                 <div className="flex justify-end mb-4 lg:absolute lg:top-8 lg:right-8 lg:mb-0">
                    <button 
                      onClick={() => setSelectedProfileId(null)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all"
                    >
                      <X size={24} />
                    </button>
                 </div>

                 {!selectedProfileData ? (
                   <div className="flex flex-col items-center justify-center h-64 gap-4">
                     <Loader2 className="animate-spin text-indigo-600" size={32} />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gathering Data...</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center">
                      <div className="relative mb-8">
                        <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-[40px] bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-2xl shadow-indigo-200">
                          <div className="w-full h-full rounded-[38px] bg-white p-1">
                            <div className="w-full h-full rounded-[34px] bg-slate-100 flex items-center justify-center overflow-hidden">
                               {selectedProfileData.avatarUrl ? (
                                 <img src={selectedProfileData.avatarUrl} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <span className="text-4xl lg:text-5xl font-black text-indigo-600">
                                   {selectedProfileData.fullName?.[0] || '?'}
                                 </span>
                               )}
                            </div>
                          </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-3xl flex items-center justify-center shadow-xl">
                           <div className="w-6 h-6 lg:w-7 lg:h-7 bg-emerald-500 rounded-2xl animate-pulse" />
                        </div>
                      </div>

                      <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-1 text-center">{selectedProfileData.fullName}</h2>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6 text-center">
                        {selectedProfileData.role || 'Community Member'}
                      </p>

                      <div className="bg-slate-50 w-full rounded-3xl p-5 border border-slate-100 mb-8 flex flex-col gap-3">
                         <div className="flex items-center gap-4 text-slate-600 text-sm font-bold">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                               <Mail size={18} />
                            </div>
                            <span className="truncate">{selectedProfileData.email}</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between w-full max-w-[300px] mb-10">
                        {[
                          { icon: <MessageSquare size={22} />, label: 'Message' },
                          { icon: <Phone size={22} />, label: 'Call' },
                          { icon: <Video size={22} />, label: 'Video' }
                        ].map((btn) => (
                          <button key={btn.label} className="flex flex-col items-center gap-3 group">
                             <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white border border-slate-200 rounded-[28px] flex items-center justify-center text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 group-hover:shadow-2xl group-hover:shadow-indigo-100 group-hover:-translate-y-1 transition-all duration-300">
                                {btn.icon}
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{btn.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="w-full mb-12">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Zap size={14} className="text-amber-500 fill-amber-500" /> Current Focus
                        </h4>
                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-white rounded-[32px] border border-indigo-100/50 shadow-sm relative overflow-hidden group">
                           <p className="text-sm text-indigo-900 font-bold leading-relaxed relative z-10">
                              "Determined to make a positive impact in our community. Let's build together!"
                           </p>
                        </div>
                      </div>

                      <div className="w-full space-y-4 pb-8">
                         {(!isFriend && selectedProfileId !== user?.uid) ? (
                           <button 
                             onClick={handleAddFriend}
                             className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 transition-all active:scale-95 group"
                           >
                             <UserPlus size={20} className="group-hover:rotate-12 transition-transform" /> Add to Friends
                           </button>
                         ) : selectedProfileId !== user?.uid ? (
                           <div className="w-full h-16 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] border border-emerald-100">
                             <UserCheck size={20} /> Already Friends
                           </div>
                         ) : null}
                         
                         <button 
                           onClick={() => {
                             setSelectedProfileId(null);
                             navigate(`/community-profile/${selectedProfileId}`);
                           }}
                           className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-[32px] flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
                         >
                           <Info size={20} className="group-hover:scale-110 transition-transform" /> View Full Profile
                         </button>
                      </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Report Channel Modal */}
      <Modal isOpen={!!messageStatisticsId} onClose={() => setMessageStatisticsId(null)} title="Message Info">
        <div className="p-6">
          {(() => {
            const msg = messages.find(m => m.id === messageStatisticsId);
            if (!msg || !activeChannel) return null;
            
            // For UI purposes, let's treat everyone in activeMembers (except the author) as having received it
            // and those who have a recent lastActive as having read it
            const recipients = activeMembers.filter(m => m.userId !== msg.author.id);
            const readBy = recipients.slice(0, Math.ceil(recipients.length / 2)); // Mock half read
            const deliveredTo = recipients.slice(Math.ceil(recipients.length / 2)); // Mock half delivered

            return (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-sm font-medium text-slate-800 break-words whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCheck size={16} className="text-[#53bdeb]" /> Read by
                  </h4>
                  {readBy.length === 0 ? (
                    <p className="text-sm text-slate-400 italic px-2">No one has read this yet</p>
                  ) : (
                    <div className="space-y-3">
                      {readBy.map(member => (
                        <div key={member.id} className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                              {member.initials}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{member.fullName}</span>
                          </div>
                          <CheckCheck size={16} className="text-[#53bdeb]" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCheck size={16} className="text-slate-400" /> Delivered to
                  </h4>
                  {deliveredTo.length === 0 ? (
                     <p className="text-sm text-slate-400 italic px-2">No remaining members</p>
                  ) : (
                    <div className="space-y-3">
                      {deliveredTo.map(member => (
                        <div key={member.id} className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                              {member.initials}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{member.fullName}</span>
                          </div>
                          <CheckCheck size={16} className="text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Channel">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!reportReason.trim()) return;
          toast.success('Thank you for reporting. Our team will review this shortly.');
          setShowReportModal(false);
          setReportReason('');
        }} className="space-y-4">
          <p className="text-sm text-slate-600 bg-amber-50 text-amber-800 p-3 rounded-lg">
            Reports are strictly confidential. The channel owner will not be notified who submitted the report.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Reason for reporting</label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please provide details about what's inappropriate in this channel..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none h-32"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reportReason.trim()}
              className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name || "Preview"}
        fullScreenOnMobile={false}
      >
        <div className="flex flex-col items-center justify-center p-2 h-full gap-4 w-full">
          {previewFile && (
            <>
              <div className="flex items-center justify-center w-full flex-1 min-h-0 overflow-y-auto">
                {previewFile.type.startsWith('image/') ? (
                  <img 
                    src={previewFile.url} 
                    alt="Preview" 
                    className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain bg-slate-900" 
                  />
                ) : previewFile.type.startsWith('audio/') ? (
                    <div className="text-center text-indigo-600 flex flex-col items-center gap-6 py-10 w-full max-w-sm mx-auto">
                       <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                           <Music size={40} />
                       </div>
                       <p className="font-bold text-slate-800 break-words px-4 w-full">{previewFile.name}</p>
                       <div className="w-full bg-slate-50 p-4 rounded-xl shadow-inner border border-slate-200">
                           <AudioPlayer src={previewFile.url} isMe={false} />
                       </div>
                    </div>
                ) : previewFile.type === 'application/pdf' ? (
                    <div className="w-full h-full min-h-[60vh] max-w-4xl mx-auto">
                        <PDFPreview url={previewFile.url} />
                    </div>
                ) : (
                    <div className="text-center text-indigo-600 flex flex-col items-center gap-3 py-10 w-full">
                       <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                           <FileText size={40} />
                       </div>
                       <div>
                           <p className="font-bold text-slate-800 break-words px-4">{previewFile.name}</p>
                           <p className="text-xs text-slate-400 mt-2">Cannot preview this file type directly.</p>
                       </div>
                    </div>
                )}
              </div>
              <a 
                href={previewFile.url} 
                download={previewFile.name} 
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Download size={18} /> Download {previewFile.type === 'application/pdf' && 'PDF'}
              </a>
            </>
          )}
        </div>
      </Modal>

      {/* WhatsApp Style Attachment Send Preview */}
      <AnimatePresence>
        {pendingAttachment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col items-center"
          >
            {/* Header */}
            <div className="flex w-full items-center gap-4 p-4 text-white bg-[#0b141a] max-w-4xl">
              <button 
                onClick={() => {
                  setPendingAttachment(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (imageInputRef.current) imageInputRef.current.value = '';
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                  if (audioInputRef.current) audioInputRef.current.value = '';
                }}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-lg font-medium truncate flex-1">{pendingAttachment.name}</h2>
            </div>
            
            {/* Preview Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 bg-[#0b141a] w-full max-w-4xl relative">
                {pendingAttachment.type.startsWith('image/') ? (
                    <img src={pendingAttachment.url} alt="Preview" className="max-w-full max-h-full object-contain" />
                ) : pendingAttachment.type === 'location/gps' ? (
                    <div className="text-center text-teal-400 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-teal-400/20 flex items-center justify-center">
                            <MapPin size={48} />
                        </div>
                        <p className="text-white text-lg font-medium">{pendingAttachment.name}</p>
                    </div>
                ) : pendingAttachment.type.startsWith('audio/') ? (
                    <div className="text-center text-orange-400 flex flex-col items-center gap-6 w-full max-w-md bg-white rounded-2xl p-8 mb-8">
                        <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                            <Music size={48} />
                        </div>
                        <div className="w-full">
                           <AudioPlayer src={pendingAttachment.url} isMe={false} />
                        </div>
                    </div>
                ) : pendingAttachment.type === 'application/pdf' ? (
                    <div className="w-full h-full bg-[#0b141a] rounded-lg overflow-hidden flex flex-col items-center justify-center">
                        <PDFPreview url={pendingAttachment.url} />
                    </div>
                ) : (
                    <div className="text-center text-indigo-400 flex flex-col items-center gap-6 w-full max-w-md">
                        <div className="w-24 h-24 rounded-full bg-indigo-400/20 flex items-center justify-center">
                            <FileText size={48} />
                        </div>
                        <p className="text-white text-lg font-medium truncate w-full px-4">{pendingAttachment.name}</p>
                        <p className="text-slate-400">{pendingAttachment.size}</p>
                    </div>
                )}
            </div>

            {/* Footer with Input and Send Button */}
            <div className="p-4 bg-[#0b141a] w-full max-w-4xl">
               <form onSubmit={handleSendMessage} className="flex gap-3 w-full">
                 <div className="flex-1 bg-[#2a2f32] rounded-3xl min-h-[50px] flex items-center px-4 self-end">
                   <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Add a caption..."
                      className="flex-1 bg-transparent border-none py-3 text-white placeholder:text-slate-400 focus:ring-0 outline-none w-full"
                      autoFocus
                    />
                 </div>
                 <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-[50px] h-[50px] rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                  >
                    {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="ml-1" />}
                 </button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          setNewMessage(reply);
          if (inputRef.current) (inputRef.current as any).focus();
        }}
      />

    </div>
  );
}
