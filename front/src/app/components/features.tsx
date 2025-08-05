import { Truck, Headphones, ShieldCheck, Flame } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Truck className="h-6 w-6 text-red-600" />,
      title: 'Free Shipping',
      desc: 'For orders from $50',
    },
    {
      icon: <Headphones className="h-6 w-6 text-red-600" />,
      title: 'Support 24/7',
      desc: 'Call us anytime',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-red-600" />,
      title: '100% Safety',
      desc: 'Only secure payments',
    },
    {
      icon: <Flame className="h-6 w-6 text-red-600" />,
      title: 'Hot Offers',
      desc: 'Discounts up to 90%',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-8 text-center">
      {features.map((feature, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          {feature.icon}
          <h3 className="font-semibold">{feature.title}</h3>
          <p className="text-sm text-gray-500">{feature.desc}</p>
        </div>
      ))}
    </section>
  );
}
