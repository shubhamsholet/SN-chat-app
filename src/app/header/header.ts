import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- Important for ngModel
import { Localstorage } from '../services/localstorage';
import { Router } from '@angular/router';
import { UserService } from '../services/user';
import { CommonModule } from '@angular/common';
import { idToken } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  searchValue: string = ''; // bound to input box
  @Output() userSelected = new EventEmitter<any>();
  filteredUsers: any[] = [];
  showDropdown = false;
  constructor(
    private localstorageService: Localstorage,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  logout() {
    this.localstorageService.clearAll();
    this.router.navigate(['/']);
  }
  goToNotifications(){
    this.router.navigate(['/notification']);
  }
  goToHome(){
    this.router.navigate(['/home']);
  }
  

  // Called whenever user types
  async onInputChange() {
    const query = this.searchValue;
    if (query.length < 3) {
      this.filteredUsers = [];
      console.log(' this.filteredUsers', this.filteredUsers);
      this.showDropdown = false;
      return;
    }

    try {
      const res = await this.userService.getUserByphoneNumber(query);
      if (Array.isArray(res)) {
        this.filteredUsers = res;
        console.log(' this.filteredUsers111', this.filteredUsers);
      } else if (res) {
        this.filteredUsers = [res];
        console.log(' this.filteredUsers222', this.filteredUsers);
        this.showDropdown = true;
      } else {
        this.filteredUsers = [];
      }
      this.showDropdown = this.filteredUsers.length > 0;
    } catch (error) {
      console.error('Error searching user:', error);
      this.filteredUsers = [];
      this.showDropdown = false;
    }
    this.cdr.detectChanges();
  }

  // When user clicks a dropdown item
  selectUser(user: any) {
    this.searchValue = user.phone;
    this.showDropdown = false;
    console.log('Selected user:', user);
    // Emit to parent
    this.userSelected.emit(user);
    console.log('Emitted user to parent:', user);
   this.goToChattingTemplete(user);
    this.cdr.detectChanges();
  }

  // Optional: handle search submit
  async onSearch() {
    this.showDropdown = false;
    console.log('Searching for:', this.searchValue);
    const res = await this.userService.getUserByphoneNumber(this.searchValue);
    console.log('searchedUser', res);
    this.cdr.detectChanges();
  }

    goToChattingTemplete(partner: any) {
    console.log('Selected partner:', partner);
    this.router.navigate(['/chatting'], { state: { partner } });
    this.cdr.detectChanges();
  }
}
