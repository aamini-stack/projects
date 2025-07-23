export interface JobInfo {
  company: string;
  role: string;
  timeRange: [string, string];
  bulletPoints: string[];
  imageSrc: string;
}

export const jobs: JobInfo[] = [
  {
    company: 'Microsoft',
    role: 'Mid-Level Software Engineer',
    timeRange: ['2022', '(Current)'],
    bulletPoints: [
      'Currently working at Microsoft Azure as a full-stack engineer implementing modern UIs and services to attract new customers to our Linux/Kubernetes cloud services.',
      'Built an interactive tutorial experience allowing customers to quickly deploy production-ready infrastructure in Azure. This tutorial experience served as an entry point for customers to learn about Azure and increased customer retention by approximately 50%.',
      'Collaborated with stakeholders to design and implement new features to make operating a Kubernetes cluster in Azure as seamless as possible. Implemented features such as Grafana metric dashboards and GitOps-powered cluster creation using FluxCD. Guaranteeing Azure stayed on the cutting edge of what customers expect.',
      'Designed and implemented a new UI for customers to visualize their Azure resources as dynamically generated graphs. These graphs made visualizing complex project setups much easier for customers.',
      'Made accessibility a priority for our team. Gave talks about ways we could improve the accessibility of our pages with tips for writing accessible UI using semantically correct HTML and following WAI specs for widgets.',
    ],
    imageSrc: '/companies/microsoft.svg',
  },
  {
    company: 'Cirrus Logic',
    role: 'Software Engineer',
    timeRange: ['2020', '2022'],
    bulletPoints: [
      'Developed Java applications that would be used by hardware engineers to aid them in the design and fine tuning of new integrated circuits.',
      'Utilized knowledge of concurrent programming to design efficient and responsive applications.',
      'Modernized legacy projects to ensure the latest software design practices were being followed such as: automated testing, version control, and adding proper API documentation.',
    ],
    imageSrc: '/companies/cirrus.png',
  },
  {
    company: 'American Express',
    role: 'Software Engineer',
    timeRange: ['2018', '2019'],
    bulletPoints: [
      'Responsible for working on Java applications that handled critical financial data that were under strict SLA deadlines.',
      'Took initiative and optimized a significant bottleneck in the application by utilizing asynchronous programming.',
      'Introduced automated testing to ensure the safety and integrity of data.',
    ],
    imageSrc: '/companies/amex.svg',
  },
];
