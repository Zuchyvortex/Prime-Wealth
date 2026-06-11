"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CreditCard {
  id: string;
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  type: "visa" | "mastercard";
  balance: number;
}

export interface User {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  balance: number;
  savings: number;
  investments: number;
  status: "active" | "suspended";
  tier: "starter" | "growth" | "elite";
  avatar: string;
  phone: string;
  job: string;
  joinedDate: string;
  cards: CreditCard[];
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: "deposit" | "withdrawal" | "transfer_send" | "transfer_receive";
  amount: number;
  category: string;
  description: string;
  status: "completed" | "pending" | "failed";
  date: string;
  targetEmail?: string;
}

export interface Notification {
  id: string;
  userEmail: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  read: boolean;
  date: string;
}

interface StateContextType {
  users: User[];
  currentUser: User | null;
  transactions: Transaction[];
  notifications: Notification[];
  isLoaded: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  sendMoney: (amount: number, recipientEmail: string, description: string, category: string) => { success: boolean; message: string };
  addFunds: (amount: number, cardId: string) => { success: boolean; message: string };
  updateProfile: (updates: Partial<User>) => void;
  adminUpdateUserStatus: (email: string, status: "active" | "suspended") => void;
  adminUpdateUserTier: (email: string, tier: "starter" | "growth" | "elite") => void;
  adminProcessTransaction: (id: string, action: "approve" | "decline") => void;
  addNotification: (email: string, title: string, message: string, type: Notification["type"]) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

// Initial Preseed Data
const DEFAULT_USERS: User[] = [
  {
    name: "John Doe",
    email: "user@primewealth.com",
    password: "password",
    role: "user",
    balance: 124500.80,
    savings: 45000.00,
    investments: 68000.00,
    status: "active",
    tier: "growth",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    phone: "+1 (555) 234-5678",
    job: "Senior Product Designer",
    joinedDate: "Jan 12, 2025",
    cards: [
      { id: "card1", number: "**** **** **** 4820", name: "John Doe", expiry: "12/28", cvv: "382", type: "visa", balance: 5200.00 },
      { id: "card2", number: "**** **** **** 9104", name: "John Doe", expiry: "08/29", cvv: "109", type: "mastercard", balance: 14500.00 }
    ]
  },
  {
    name: "Sarah Jenkins",
    email: "admin@primewealth.com",
    password: "adminpassword",
    role: "admin",
    balance: 0,
    savings: 0,
    investments: 0,
    status: "active",
    tier: "elite",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    phone: "+1 (555) 987-6543",
    job: "Wealth Operations Admin",
    joinedDate: "Oct 01, 2024",
    cards: []
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    userId: "user@primewealth.com",
    userEmail: "user@primewealth.com",
    userName: "John Doe",
    type: "transfer_receive",
    amount: 15000.00,
    category: "Salary",
    description: "Monthly Consulting Fee",
    status: "completed",
    date: "2026-05-20T10:30:00Z"
  },
  {
    id: "tx_2",
    userId: "user@primewealth.com",
    userEmail: "user@primewealth.com",
    userName: "John Doe",
    type: "transfer_send",
    amount: 2500.00,
    category: "Investments",
    description: "Portfolio Rebalancing",
    status: "completed",
    date: "2026-05-21T14:20:00Z",
    targetEmail: "invest@primewealth.com"
  },
  {
    id: "tx_3",
    userId: "user@primewealth.com",
    userEmail: "user@primewealth.com",
    userName: "John Doe",
    type: "withdrawal",
    amount: 450.00,
    category: "Utilities",
    description: "Server Hosting Services",
    status: "completed",
    date: "2026-05-22T08:15:00Z"
  },
  {
    id: "tx_4",
    userId: "user@primewealth.com",
    userEmail: "user@primewealth.com",
    userName: "John Doe",
    type: "deposit",
    amount: 5000.00,
    category: "Transfer",
    description: "Added Funds from Card",
    status: "completed",
    date: "2026-05-22T19:00:00Z"
  },
  {
    id: "tx_5",
    userId: "user@primewealth.com",
    userEmail: "user@primewealth.com",
    userName: "John Doe",
    type: "withdrawal",
    amount: 8500.00,
    category: "Investments",
    description: "Venture Pool Allocation",
    status: "pending",
    date: "2026-05-23T11:45:00Z"
  }
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "not_1",
    userEmail: "user@primewealth.com",
    title: "Deposit Successful",
    message: "Your deposit of $5,000.00 from Visa card **** 4820 has been cleared.",
    type: "success",
    read: false,
    date: "2026-05-22T19:05:00Z"
  },
  {
    id: "not_2",
    userEmail: "user@primewealth.com",
    title: "Pending Approval",
    message: "Your withdrawal of $8,500.00 is awaiting compliance officer review.",
    type: "warning",
    read: false,
    date: "2026-05-23T11:45:00Z"
  },
  {
    id: "not_3",
    userEmail: "user@primewealth.com",
    title: "Security Update",
    message: "Your profile security settings were successfully updated.",
    type: "info",
    read: true,
    date: "2026-05-18T16:22:00Z"
  }
];

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state with localStorage safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("pw_users");
      const storedTx = localStorage.getItem("pw_tx");
      const storedNot = localStorage.getItem("pw_notifications");
      const storedSession = localStorage.getItem("pw_session");

      setUsers(storedUsers ? JSON.parse(storedUsers) : DEFAULT_USERS);
      setTransactions(storedTx ? JSON.parse(storedTx) : DEFAULT_TRANSACTIONS);
      setNotifications(storedNot ? JSON.parse(storedNot) : DEFAULT_NOTIFICATIONS);
      
      if (storedSession) {
        setCurrentUser(JSON.parse(storedSession));
      }
      setIsLoaded(true);
    }
  }, []);

  // Save updates to localStorage
  const saveState = (newUsers: User[], newTx: Transaction[], newNot: Notification[], sessionUser: User | null) => {
    setUsers(newUsers);
    setTransactions(newTx);
    setNotifications(newNot);
    setCurrentUser(sessionUser);

    if (typeof window !== "undefined") {
      localStorage.setItem("pw_users", JSON.stringify(newUsers));
      localStorage.setItem("pw_tx", JSON.stringify(newTx));
      localStorage.setItem("pw_notifications", JSON.stringify(newNot));
      if (sessionUser) {
        localStorage.setItem("pw_session", JSON.stringify(sessionUser));
      } else {
        localStorage.removeItem("pw_session");
      }
    }
  };

  // Auth Methods
  const login = async (email: string, password: string) => {
    // Delay simulation for premium spinner feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: "Account not found." };
    }
    if (user.password !== password) {
      return { success: false, message: "Incorrect password." };
    }
    if (user.status === "suspended") {
      return { success: false, message: "Your account is suspended. Contact compliance." };
    }

    // Login successful
    saveState(users, transactions, notifications, user);
    return { success: true, message: "Logged in successfully", role: user.role };
  };

  const register = async (name: string, email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, message: "Email already registered." };
    }

    const newUser: User = {
      name,
      email,
      password,
      role: "user",
      balance: 10000.00, // Preseed new users with a warm welcome balance
      savings: 2500.00,
      investments: 0.00,
      status: "active",
      tier: "starter",
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      phone: "",
      job: "Wealth Advisory Member",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      cards: [
        {
          id: `card_${Date.now()}`,
          number: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
          name,
          expiry: "09/30",
          cvv: String(Math.floor(100 + Math.random() * 900)),
          type: "visa",
          balance: 2000.00
        }
      ]
    };

    const newUsers = [...users, newUser];
    const systemNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: email,
      title: "Welcome to Prime Wealth",
      message: "Your premium account setup is complete. Enjoy $10,000.00 complimentary starter balance.",
      type: "success",
      read: false,
      date: new Date().toISOString()
    };
    const newNot = [systemNot, ...notifications];

    saveState(newUsers, transactions, newNot, newUser);
    return { success: true, message: "Account created successfully" };
  };

  const logout = () => {
    saveState(users, transactions, notifications, null);
  };

  // Transaction Methods
  const sendMoney = (amount: number, recipientEmail: string, description: string, category: string) => {
    if (!currentUser || currentUser.role !== "user") {
      return { success: false, message: "Unauthorized action" };
    }
    if (currentUser.balance < amount) {
      return { success: false, message: "Insufficient balance" };
    }

    // Deduct from current user
    const updatedCurrentUser = {
      ...currentUser,
      balance: parseFloat((currentUser.balance - amount).toFixed(2))
    };

    // Credit recipient if they are in our mock system
    const updatedUsers = users.map((u) => {
      if (u.email.toLowerCase() === recipientEmail.toLowerCase()) {
        return {
          ...u,
          balance: parseFloat((u.balance + amount).toFixed(2))
        };
      }
      if (u.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return updatedCurrentUser;
      }
      return u;
    });

    // Create transactional records
    const txId = `tx_${Date.now()}`;
    const newTxSender: Transaction = {
      id: txId,
      userId: currentUser.email,
      userEmail: currentUser.email,
      userName: currentUser.name,
      type: "transfer_send",
      amount,
      category,
      description,
      status: "completed",
      date: new Date().toISOString(),
      targetEmail: recipientEmail
    };

    let newTxList = [newTxSender, ...transactions];

    // If recipient is a registered user, also create their receive record
    const recipient = users.find((u) => u.email.toLowerCase() === recipientEmail.toLowerCase());
    if (recipient) {
      const newTxReceiver: Transaction = {
        id: `tx_${Date.now() + 1}`,
        userId: recipient.email,
        userEmail: recipient.email,
        userName: recipient.name,
        type: "transfer_receive",
        amount,
        category,
        description: `${description} (from ${currentUser.name})`,
        status: "completed",
        date: new Date().toISOString(),
        targetEmail: currentUser.email
      };
      newTxList = [newTxReceiver, ...newTxList];
    }

    // Notifications
    const senderNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: currentUser.email,
      title: "Transfer Sent",
      message: `You successfully transferred $${amount.toLocaleString()} to ${recipientEmail}.`,
      type: "success",
      read: false,
      date: new Date().toISOString()
    };

    let newNotList = [senderNot, ...notifications];

    if (recipient) {
      const receiverNot: Notification = {
        id: `not_${Date.now() + 1}`,
        userEmail: recipient.email,
        title: "Funds Received",
        message: `You received $${amount.toLocaleString()} from ${currentUser.name}.`,
        type: "success",
        read: false,
        date: new Date().toISOString()
      };
      newNotList = [receiverNot, ...newNotList];
    }

    saveState(updatedUsers, newTxList, newNotList, updatedCurrentUser);
    return { success: true, message: `Successfully sent $${amount.toLocaleString()}!` };
  };

  const addFunds = (amount: number, cardId: string) => {
    if (!currentUser || currentUser.role !== "user") {
      return { success: false, message: "Unauthorized action" };
    }

    const card = currentUser.cards.find(c => c.id === cardId);
    if (!card) {
      return { success: false, message: "Card not found" };
    }

    // If card exists, we deduct from card's limit and add to main balance
    const updatedCards = currentUser.cards.map(c => {
      if (c.id === cardId) {
        return { ...c, balance: parseFloat((c.balance - amount).toFixed(2)) };
      }
      return c;
    });

    const updatedCurrentUser: User = {
      ...currentUser,
      balance: parseFloat((currentUser.balance + amount).toFixed(2)),
      cards: updatedCards
    };

    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return updatedCurrentUser;
      }
      return u;
    });

    const txId = `tx_${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      userId: currentUser.email,
      userEmail: currentUser.email,
      userName: currentUser.name,
      type: "deposit",
      amount,
      category: "Transfer",
      description: `Added funds via ${card.type.toUpperCase()} card`,
      status: "completed",
      date: new Date().toISOString()
    };

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: currentUser.email,
      title: "Deposit Completed",
      message: `Successfully funded $${amount.toLocaleString()} into your primary vault account.`,
      type: "success",
      read: false,
      date: new Date().toISOString()
    };

    saveState(updatedUsers, [newTx, ...transactions], [newNot, ...notifications], updatedCurrentUser);
    return { success: true, message: `Deposited $${amount.toLocaleString()} successfully.` };
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;

    const updatedCurrentUser = {
      ...currentUser,
      ...updates
    };

    const updatedUsers = users.map((u) => {
      if (u.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return updatedCurrentUser;
      }
      return u;
    });

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: currentUser.email,
      title: "Profile Updated",
      message: "Your account credentials and details were successfully modified.",
      type: "info",
      read: false,
      date: new Date().toISOString()
    };

    saveState(updatedUsers, transactions, [newNot, ...notifications], updatedCurrentUser);
  };

  // Admin Methods
  const adminUpdateUserStatus = (email: string, status: "active" | "suspended") => {
    const updatedUsers = users.map((u) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, status };
      }
      return u;
    });

    // If changing the current user's session profile
    let updatedSession = currentUser;
    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      updatedSession = { ...currentUser, status };
    }

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: email,
      title: status === "suspended" ? "Account Suspended" : "Account Re-activated",
      message: status === "suspended"
        ? "Compliance has temporarily frozen your transactions. Please reach out to verify account details."
        : "Compliance has completed reviews. Full dashboard activities restored.",
      type: status === "suspended" ? "alert" : "success",
      read: false,
      date: new Date().toISOString()
    };

    saveState(updatedUsers, transactions, [newNot, ...notifications], updatedSession);
  };

  const adminUpdateUserTier = (email: string, tier: "starter" | "growth" | "elite") => {
    const updatedUsers = users.map((u) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, tier };
      }
      return u;
    });

    let updatedSession = currentUser;
    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      updatedSession = { ...currentUser, tier };
    }

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: email,
      title: "Wealth Tier Upgraded",
      message: `Congratulations! Your profile has been promoted to the ${tier.toUpperCase()} Wealth tier.`,
      type: "success",
      read: false,
      date: new Date().toISOString()
    };

    saveState(updatedUsers, transactions, [newNot, ...notifications], updatedSession);
  };

  const adminProcessTransaction = (id: string, action: "approve" | "decline") => {
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    const newStatus = action === "approve" ? "completed" : "failed";

    // Adjust user balance if pending was approved/declined
    const updatedTxList = transactions.map((t) => {
      if (t.id === id) {
        return { ...t, status: newStatus as "completed" | "failed" };
      }
      return t;
    });

    const userToUpdate = users.find((u) => u.email.toLowerCase() === targetTx.userEmail.toLowerCase());
    
    let updatedUsers = users;
    let updatedSession = currentUser;

    if (userToUpdate && action === "decline") {
      // Return money back to account balance if a send/withdrawal transaction failed/was declined
      let refundAmount = 0;
      if (targetTx.type === "withdrawal" || targetTx.type === "transfer_send") {
        refundAmount = targetTx.amount;
      }

      updatedUsers = users.map((u) => {
        if (u.email.toLowerCase() === targetTx.userEmail.toLowerCase()) {
          const newBal = parseFloat((u.balance + refundAmount).toFixed(2));
          const updatedUserObj = { ...u, balance: newBal };
          if (currentUser && currentUser.email.toLowerCase() === u.email.toLowerCase()) {
            updatedSession = updatedUserObj;
          }
          return updatedUserObj;
        }
        return u;
      });
    } else if (userToUpdate && action === "approve") {
      // If it's a pending deposit (which adds to balance upon approval)
      let addAmount = 0;
      if (targetTx.type === "deposit" || targetTx.type === "transfer_receive") {
        addAmount = targetTx.amount;
      }

      updatedUsers = users.map((u) => {
        if (u.email.toLowerCase() === targetTx.userEmail.toLowerCase()) {
          const newBal = parseFloat((u.balance + addAmount).toFixed(2));
          const updatedUserObj = { ...u, balance: newBal };
          if (currentUser && currentUser.email.toLowerCase() === u.email.toLowerCase()) {
            updatedSession = updatedUserObj;
          }
          return updatedUserObj;
        }
        return u;
      });
    }

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: targetTx.userEmail,
      title: action === "approve" ? "Transaction Cleared" : "Transaction Declined",
      message: action === "approve"
        ? `Your transaction of $${targetTx.amount.toLocaleString()} has been approved and settled.`
        : `Your transaction of $${targetTx.amount.toLocaleString()} was declined by safety operations. Funds restored.`,
      type: action === "approve" ? "success" : "alert",
      read: false,
      date: new Date().toISOString()
    };

    saveState(updatedUsers, updatedTxList, [newNot, ...notifications], updatedSession);
  };

  // Notification Methods
  const addNotification = (email: string, title: string, message: string, type: Notification["type"]) => {
    const newNot: Notification = {
      id: `not_${Date.now()}`,
      userEmail: email,
      title,
      message,
      type,
      read: false,
      date: new Date().toISOString()
    };
    saveState(users, transactions, [newNot, ...notifications], currentUser);
  };

  const markNotificationAsRead = (id: string) => {
    const updatedNotList = notifications.map((n) => {
      if (n.id === id) return { ...n, read: true };
      return n;
    });
    saveState(users, transactions, updatedNotList, currentUser);
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    const updatedNotList = notifications.map((n) => {
      if (n.userEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        return { ...n, read: true };
      }
      return n;
    });
    saveState(users, transactions, updatedNotList, currentUser);
  };

  return (
    <StateContext.Provider
      value={{
        users,
        currentUser,
        transactions,
        notifications,
        isLoaded,
        login,
        register,
        logout,
        sendMoney,
        addFunds,
        updateProfile,
        adminUpdateUserStatus,
        adminUpdateUserTier,
        adminProcessTransaction,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within a StateProvider");
  }
  return context;
};
