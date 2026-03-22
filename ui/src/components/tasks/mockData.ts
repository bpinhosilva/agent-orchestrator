import type { Task } from './types';

export const initialTasks: Task[] = [
  {
    id: '1',
    status: 'backlog',
    code: '#NODE-402',
    priority: 'HIGH',
    title: 'Optimize Vector DB Latency',
    agent: {
      name: 'Loomis-AI',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-OZJTXN_AjDz9KCaZceEfTrT4qWFHE--IdjUUCq_OvsHbZ1uJ3CYBs6HqaBFJXd6GqAzwf6hONuhqcGDtUFDdpQBja3-ADvkQHM3qDvTWsyZZsLCU3OXFDfEwOCk7s0Zq5madvqehTHWGl7DzhWpmD-7ywR70ePgETq3kaHIYdC3dVRiu02pv6eUroe65kPq0WWQr-31AaLxmdPDgdHNBus-fWMLF2cFMm0Cf-NKfbgVzrSQy1Wp_JtRbG6or94YVDVtJ7GMNuWA',
      colorClass: 'bg-tertiary-container/30 border-tertiary/20'
    },
    timeIcon: 'schedule',
    timeValue: '2d'
  },
  {
    id: '2',
    status: 'backlog',
    code: '#NODE-408',
    priority: 'LOW',
    title: 'Documentation Sweep: API v4',
    agent: {
      name: 'Scribe-Bot',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSFJXh9-b55K5hLKmZkPjPPvFpxzO-JNjnwoVu_MjZV-YsWmKwssvr-iX8RK6O4dchEG-sRX2VSdgHhMyQtsHEONkqn34VKjsPt-q039Au2bj8tdIIi1EUwx-UxypTnxVEeU9gcI0PoV_twhhU1eWpyuVXBpY1EDGucPILLAGheIn3NrNdlU911tUDDwDxFqrRd7s5rGNb2Yq9ubGkMb0K7wTo8S8RX5H9r0DD6U0fqma80BRaHyyQQ49ievQ89PALaPwjU47KNxs',
      colorClass: 'bg-surface-container-highest border-outline-variant/30'
    },
    timeIcon: 'attach_file',
    timeValue: 4
  },
  {
    id: '3',
    status: 'in-progress',
    code: '#NODE-395',
    priority: 'MED',
    title: 'Analyze Market Sentiment',
    agent: {
      name: 'Fin-Oracle',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgTEKIwatDZ11tiBKlsq2121RK5BWzo-xhRi6qKaw_vNXYaIPnum0tICO1deXJ-6xKMUx2CN4FQC2cIsWeZjVSZ6-qI9pMpgwrXM7n-vuxlimCdaAoXORU6JmF45HFSNAgblT5cAd0rx_9Emq2o5iGlPoV9lQneUwzaLkJcdeI9emwbTCgYhWOu8xIKa6_clFpZwEpYi2IUoyPgcgZTX1L_u_-uUvSffVvI2_X3rf6Ut2ptx8n7bGcObxmg56paO9phk7JNCf9S9c',
      colorClass: 'bg-secondary-container/30 border-secondary/20'
    },
    progress: 68,
    isActive: true
  },
  {
    id: '4',
    status: 'in-progress',
    code: '#NODE-411',
    priority: 'HIGH',
    title: 'Global Node Handshake Protocol',
    agent: {
      name: 'Sync-Master',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLRE6uQCSDrlKCPicRwTu3qQqNTYRiHrvcWgyC8JRTxCNtFa-7d8Cwj2Sao_75KIotausbJ2JNRfN3iwrOVYo02wcE6bbTWtgWn9YQyBvgWYytE6C1faeeH6gB0brNabroNKgZT25AuG4pGhyEN8fdXOgMuGPLeGrccLRqu7iS2ddbX9eGYWtPZ3DOqTS1birDGh3oQyJId8K5pMk03bwgvsbqPvecNngC5v_pSSGOMa1VaNjHa-xb0OnQJQFAwC1fzrkZ5S-Y4iE',
      colorClass: 'bg-primary-container/30 border-primary/20'
    },
    progress: 15
  },
  {
    id: '5',
    status: 'review',
    code: '#NODE-388',
    priority: 'MED',
    title: 'Anomalous Packet Filtering',
    agent: {
      name: 'Sentry-X',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBLJR_B6Im0POTT0TE--ELeup7lOkBCcWvNOPu0A7TsYjJlVahtk5mN_2yu9M1w0_TQKCPEg4TeCnN0NIDlin5u4MApSOC_6GeYXh6-lk0owsRKFeIYdTpz3vcYJm0JCAfozLXlLNg97Ts7LFYDp7OzpX2_5GBD6h8Sn5WtvWR6e5-S7uNUmqwldRgKmJnV6DRWy24kO4qVUNQEUXZ8362mu9_eUbowaIVK46kkuvCsUFjM2loTwLOJezRqxiwFxSYUiXzYtjGxvU',
      colorClass: 'bg-surface-container-highest border-outline-variant/30'
    },
    awaitingReview: true,
    timeIcon: 'comment',
    timeValue: 12
  },
  {
    id: '6',
    status: 'done',
    code: '#NODE-372',
    title: 'Batch Vector Embedding Generation',
    agent: {
      name: 'Embed-Bot',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3VyIWYSwI4zEy329K9_oEeUVYnGtg4tCAXKjkkYz3XPLL3mtgymARXw8lYjFYlzRhbHLWJsw9mXI8ZCUIUVlAO22dl4_nUgX9voR3b3Fw8vZNsl5532WRHQ9cHMQCnRELEOQe2U1WdmmcuPq5xhPE3StsLVxL1JZIFCUo1SCuBl_CIRh35DW_k9_s6djBr_1UNo1YsN4q5VIZ73V0lQyvpp2KLREt_kyFKvCGT_dESod27XzEgID7_XlwGd41FCVYoDsSAYJPSzc'
    }
  }
];
