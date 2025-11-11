import { Component, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-chat-card',
  imports: [],
  templateUrl: './chat-card.html',
  styleUrl: './chat-card.scss',
})
export class ChatCard {
  @Input() partner: any; // or use a proper type/interface if available
  @Input() name = 'Unknown';
  @Input() message = 'No message provided.';
  @Input() timestamp: Date | string | number = new Date();
  @Input() status: 'single' | 'double' | 'processing' = 'single';
  // optional: if you need to normalize to a specific timezone offset in minutes
  @Input() timezoneOffsetMinutes?: number;

  ngOnInit(): void {
    console.log('🟢 Partner received on init:', this.partner);
    this.name = this.partner?.data?.name || this.name;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['partner']) {
      console.log('🔄 Partner changed:', changes['partner'].currentValue);
    }
  }
  get initials() {
    const parts = (this.name || '').trim().split(/\s+/);
    return (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
  }
  


  // Short subtext (e.g., "Online", "Last seen", or a role)
  get subText() {
    return 'Active';
  }


  get dateObj() {
    const t = this.timestamp;
    const d = (t instanceof Date) ? t : new Date(t);
    if (this.timezoneOffsetMinutes != null && !isNaN(this.timezoneOffsetMinutes)) {
      // shift to desired timezone offset (minutes)
      const localOffset = d.getTimezoneOffset();
      const delta = this.timezoneOffsetMinutes + localOffset; // minutes to add
      return new Date(d.getTime() + delta * 60_000);
    }
    return d;
  }


  // If message is within last 24 hours -> show time (HH:MM), else show date (DD MMM)
  get formattedDate() {
    const d = this.dateObj;
    const now = new Date();
    const diff = Math.abs(now.getTime() - d.getTime());
    const oneDay = 24 * 60 * 60 * 1000;
    if (diff < oneDay) {
      // show time like 14:32
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  }


  get statusIcon() {
    // Returns inline SVG/HTML for quick insertion. You can swap to <img> or font icons.
    if (this.status === 'single') {
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
<path d="M6.173 11.414 2.76 8l1.06-1.06 2.354 2.354L12.18 2.2l1.06 1.06z"/>
</svg>
`;
    }
    if (this.status === 'double') {
      // double tick — use blue-ish fill to mimic WhatsApp "read"
      return `
<svg class="icon-blue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden>
<path fill="#34B7F1" d="M6.173 11.414 2.76 8l1.06-1.06 2.354 2.354L12.18 2.2l1.06 1.06z"/>
<path fill="#34B7F1" d="M2.173 11.414-.24 8l1.06-1.06 2.354 2.354L8.18 2.2l1.06 1.06z" opacity="0.95"/>
</svg>
`;
    }
    // processing
    return `<div class="processing-spin" role="img" aria-label="processing"></div>`;
  }
}
