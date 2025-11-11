import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { UserService } from '../services/user';
import { Router } from '@angular/router';
import { Localstorage } from '../services/localstorage';
import { NotificationService } from '../services/notification';

@Component({
  selector: 'app-login-register',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-register.html',
  styleUrl: './login-register.scss',
})
export class LoginRegister {
  currentView: 'login' | 'register' | 'forgot' = 'register';

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotForm!: FormGroup;

  constructor(private fb: FormBuilder, private userService: UserService,
    private router: Router, private localStorageService: Localstorage,
    private cdr: ChangeDetectorRef, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.forgotForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]]
    });
  }

  // ✅ Custom validator for matching passwords
  passwordMatchValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const password = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
  };

  switchView(view: 'login' | 'register' | 'forgot') {
    this.currentView = view;
  }

  async onLogin() {
    if (this.loginForm.valid) {
      console.log('✅ Login Data:', this.loginForm.value);
      await this.userService.getUserByphoneNumber('shu@gmail.com');
      const user = await this.userService.getUserByphoneNumber(this.loginForm.value.phoneNumber);
      console.log(user);

      if (user) {
        if (user.data.password === this.loginForm.value.password) {
          console.log('✅ Login Successful');
          this.router.navigate(['/home']);
          this.localStorageService.setItem('user-UID', user.id);
          this.localStorageService.setItem('user-Name', user.data.name);
          console.log('✅ navigation  Successful');
          this.userService.showToast('User Logged in successfully', 'success');
          this.loginForm.reset();

          // Manual notification creation
          this.notificationService.addNotification({
            type: 'system',
            title: 'Welcome!',
            body: 'Welcome to our app!',
            metadata: { welcome: true }
          });


        } else {
          console.log('❌ Invalid phoneNumber or password');
          this.userService.showToast('Invalid phoneNumber or password', 'error');
        }
      } else {
        console.log('❌ User not found');
        this.userService.showToast('User not found', 'error');

      }

    } else {
      this.loginForm.markAllAsTouched();
    }
    this.cdr.detectChanges();
  }

  async onRegister() {
    if (this.registerForm.valid) {
      console.log('✅ Register Data:', this.registerForm.value);
      await this.userService.createUser(this.registerForm.value.name, this.registerForm.value.phoneNumber, this.registerForm.value.password);
      // this.userService.showToast('User Registered successfully', 'success');
      this.registerForm.reset();
    } else {
      this.registerForm.markAllAsTouched();
    }
    this.cdr.detectChanges();
  }

  onForgotPassword() {
    if (this.forgotForm.valid) {
      console.log('✅ Forgot Password Data:', this.forgotForm.value);
    } else {
      this.forgotForm.markAllAsTouched();
    }
  }

}
