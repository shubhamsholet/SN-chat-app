import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Localstorage } from '../../services/localstorage';
import { User, UserService } from '../../services/user';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatting-templete',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatting-templete.html',
  styleUrl: './chatting-templete.scss',
})
export class ChattingTemplete implements OnInit {
  partner: any;
  currentUser: any;
  message: string = '';
  allChatList: any = [];
  currentuserChatList: any;
  partnerChatList: any;
  chatwithpartner: any = {
    partnerName: '',
    partnerUID: '',
  }

  currentChatMessages: any;

  noMessageFound: boolean = false;
  isLoading: boolean = true; // New loading state
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;


  // To hold subscribed user data
  userData: User | undefined;
  private userSub?: Subscription;


  constructor(public router: Router, private localStorage: Localstorage,
    private userService: UserService, private cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    // Get data passed from previous route
    this.partner = history.state.partner;
    console.log('Received partner:', this.partner);
    const partnerUID = this.partner.partnerUID || this.partner.id as string;
    if (this.partner) {
      console.log('partnerUID', partnerUID)
      const updatedPartner = await this.userService.getUserById(partnerUID);
      this.partner = updatedPartner;
      console.log('🔄 Updated partner from Firestore:', this.partner);

      if (!this.partner.data.allChatList) {
        await this.userService.updateUser(partnerUID, {
          allChatList: this.allChatList
        });
        console.log('allChatList is added to partner user');
         const updatedPartner = await this.userService.getUserById(partnerUID);
      this.partner = updatedPartner;
       console.log('🔄 Updated partner from Firestore:', this.partner);
      } else {
        console.log('currentuser allchatlist already exist')
      }
    } else {
      console.log('partner is not found');
    }
    // Optional: redirect if no partner data is passed
    if (!this.partner) {
      this.router.navigate(['/home']); // fallback
    }
    const currentuserUID = this.localStorage.getItem('user-UID') as string;
    const user = await this.userService.getUserById(currentuserUID);
    if (user) {
      this.currentUser = user
      console.log(' this.currentUser:', this.currentUser);
      if (!this.currentUser.data.allChatList) {
        await this.userService.updateUser(currentuserUID, {
          allChatList: this.allChatList
        });
        console.log('allChatList is added to current user');
        console.log('updated this.current user', this.currentUser)
      } else {
        console.log('currentuser allchatlist already exist')
      }
      // Re-fetch from Firestore
      const updatedCurrentUser = await this.userService.getUserById(currentuserUID);
      this.currentUser = updatedCurrentUser;
      console.log('🔄 Updated current user from Firestore:', this.currentUser);
    } else {
      console.log('current User not found');
    }


    // subscribe to user changes
    this.userSub = this.userService.listenToUser(currentuserUID).subscribe(user => {
      this.userData = user;
      console.log('🔥 User changed:', user);
      this.onUserChanged(user);
    });



    // current chat messages
    this.fetchCurrentChatMessages()
    this.cdr.detectChanges();
  }


  async fetchCurrentChatMessages() {
    this.isLoading = true;
    this.noMessageFound = false;
    const chatPartnerUID = this.partner.id as string;
    const currentuserUID = this.localStorage.getItem('user-UID') as string;
    // Re-fetch from Firestore
    const updatedCurrentUser = await this.userService.getUserById(currentuserUID);
    this.currentUser = updatedCurrentUser;
    if (this.currentUser.data.allChatList) {
      const chatIndex = this.currentUser.data.allChatList.findIndex((chat: any) => chat.partnerUID === chatPartnerUID);
      console.log('chatIndex1', chatIndex)
      if (chatIndex !== -1) {
        console.log('chat found AAAAAAAAA', chatIndex);
        const currentChat = this.currentUser.data.allChatList[chatIndex];
        console.log('✅ Chat found:', currentChat);
        this.currentChatMessages = currentChat;
        console.log('this.currentChatMessages', this.currentChatMessages)
          this.noMessageFound = false;
      } else {
        // Chat doesn't exist, create new chat entry
        console.log('No existing chat AAAAAAAAAA');
          this.noMessageFound = true;
      }
    } else {
      this.currentChatMessages = null;
      this.noMessageFound = true;
    }
        this.isLoading = false;
    this.cdr.detectChanges();
  }



  async pushMessage(userMessage: string) {
    this.isLoading = true;
    this.fetchCurrentChatMessages()
    const currentuserUID = this.localStorage.getItem('user-UID') as string;
    const currentuserName = this.localStorage.getItem('user-Name') as string;
    const chatPartnerUID = this.partner.id as string;
    const chatPartnerName = this.partner.data.name as string;
    const chatPartnerPhone = this.partner.data.phoneNumber as string;
    const timestamp = new Date().toISOString();

    if (!currentuserUID || !chatPartnerUID) return;

    const updatedCurrentUser = await this.userService.getUserById(currentuserUID);
    this.currentUser = updatedCurrentUser;
    const updatedPartner = await this.userService.getUserById(chatPartnerUID);
    this.partner = updatedPartner;

    // ✅ Step 1: Create message for current user
    const myMessage = {
      text: userMessage,
      time: timestamp,
      type: 'me'
    };

    // ✅ Step 2: Create message for partner
    const partnerMessage = {
      text: userMessage,
      time: timestamp,
      type: 'other'
    };
    console.log('his.currentUser.data.allChatList', this.currentUser.data.allChatList)

    // ✅ Step 3: Update current user's chat list 
    if (this.currentUser.data.allChatList) {
      const chatIndex = this.currentUser.data.allChatList.findIndex((chat: any) => chat.partnerUID === chatPartnerUID);
      console.log('chatIndex1', chatIndex)

      if (chatIndex !== -1) {
        console.log('Chat found chat for partner at index:', chatIndex);
        // Chat exists, append message
        this.currentUser.data.allChatList[chatIndex].lastMeassage = myMessage;
        this.currentUser.data.allChatList[chatIndex].messages.push(myMessage);
        this.userService.updateUser(currentuserUID, {
          allChatList: this.currentUser.data.allChatList
        });

        console.log('Appended message to existing  chat for partner 11111111');
      } else {
        // Chat doesn't exist, create new chat entry
        console.log('No existing chat for partner, creating new chat entry');
        this.currentUser.data.allChatList.push({
          partnerName: chatPartnerName,
          partnerUID: chatPartnerUID,
          partnerPhone: chatPartnerPhone,
          lastMeassage: myMessage,
          messages: [myMessage]
        });
        this.userService.updateUser(currentuserUID, {
          allChatList: this.currentUser.data.allChatList
        });

        console.log('Created new chat entry for partner 22222222222');
      }
    }

    // ✅ Step 4: Update partner chat list
    console.log('his.partner.data.allChatList', this.partner.data.allChatList)

    if (this.partner.data.allChatList) {
      const chatIndex = this.partner.data.allChatList.findIndex((chat: any) => chat.partnerUID === currentuserUID);

      console.log('user index in partner chatIndex', chatIndex)
      if (chatIndex !== -1) {
        console.log('Chat found for current user in partner list at index:', chatIndex);

        // Chat exists, append message
        this.partner.data.allChatList[chatIndex].lastMeassage = partnerMessage;
        this.partner.data.allChatList[chatIndex].messages.push(partnerMessage);
        // const check = this.currentUser.data.allChatList[chatIndex].messages.push(myMessage);
        this.userService.updateUser(chatPartnerUID, {
          allChatList: this.partner.data.allChatList
        });

        console.log('Appended message to existing  for current user 11111111');


      } else {
        console.log('No existing chat for current user in partner list, creating new chat entry');

        this.partner.data.allChatList.push({
          partnerName: currentuserName,
          partnerUID: currentuserUID,
          lastMeassage: partnerMessage,
          messages: [partnerMessage]
        });
        this.userService.updateUser(chatPartnerUID, {
          allChatList: this.partner.data.allChatList
        });
        console.log('Created new chat entry for current user22222222222');


      }
    }

    this.fetchCurrentChatMessages()
    this.cdr.detectChanges();
  }



  sendMessage() {
    console.log('Message:', this.message);
    this.pushMessage(this.message);
    this.message = '';
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 0);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
    this.cdr.detectChanges();
  }

  private scrollToBottom() {
    const container = document.querySelector('.chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
    this.cdr.detectChanges();
  }


  async onUserChanged(user: User | undefined) {
    console.log('⚡ Detected change, trigger action here!');
    this.fetchCurrentChatMessages();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }
}
