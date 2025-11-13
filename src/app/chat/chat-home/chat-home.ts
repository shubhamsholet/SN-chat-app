import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ChatCard } from "../chat-card/chat-card";
import { Router } from '@angular/router';
import { UserService } from '../../services/user';
import { Localstorage } from '../../services/localstorage';
import { Header } from "../../header/header";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-home',
  imports: [ChatCard, Header, CommonModule],
  templateUrl: './chat-home.html',
  styleUrl: './chat-home.scss',
})
export class ChatHome implements OnInit {
  isLoggedIn: boolean = false;
  Listofpartners: any[] = [];
  listOfChatPersons: any[] = []
  currentUser: any;
  constructor(private router: Router,
    private userService: UserService,
    private localservice: Localstorage,
    private cdr: ChangeDetectorRef) {
    this.isLoggedIn = !!this.localservice.getItem('user-UID');
  }

  users: any = [];
  // Add loading state
  isLoading: boolean = true;


  goToChattingTemplete(partner: any) {
    console.log('Selected partner:', partner);
    this.router.navigate(['/chatting'], { state: { partner } });
    this.cdr.detectChanges();
  }

  async ngOnInit() {
    console.log('Is Logged In:', this.isLoggedIn);
    // Show loader immediately
    this.isLoading = true;
    try {
      this.users = await this.userService.getAllUsers();
      this.fetchChatPartners()
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchChatPartners() {
    const currentuserUID = this.localservice.getItem('user-UID') as string;

    if (!currentuserUID) {
      this.isLoading = false;
      return;
    }
    const user = await this.userService.getUserById(currentuserUID);
    console.log('user', user)
    if (user) {
      this.currentUser = user
    } else return

    if (this.currentUser.data.allChatList) {
      const chatSummaries = this.currentUser.data.allChatList.map((chat: { partnerName: any; partnerUID: any; lastMeassage: {}; }) => ({
        partnerName: chat.partnerName,
        partnerUID: chat.partnerUID,
        lastMessage: chat.lastMeassage || "(no message)"
      }));
      // this.listOfChatPersons = chatSummaries
      this.listOfChatPersons = chatSummaries.sort((a: any, b: any) => {
        return new Date(b.lastMessage.time).getTime() - new Date(a.lastMessage.time).getTime();
      });

      console.log('this.listOfChatPersons', this.listOfChatPersons); 
    }


    this.cdr.detectChanges();
  }


  onUserSelected(user: any) {
    console.log('Received from header:', user);
    const alreadyExists = this.Listofpartners.some(
      (partner) => partner.id === user.id
    );

    if (!alreadyExists) {
      this.Listofpartners.unshift(user);
      this.listOfChatPersons.unshift(user);
      console.log('User added:', user);
    } else {
      console.log('Duplicate user, not adding:', user);
    }

    console.log('Updated Listofpartners:', this.Listofpartners);
    this.cdr.detectChanges();
  }

}
