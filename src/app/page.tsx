import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
  return(
      <div>
        ABC
      </div>
  );

}
