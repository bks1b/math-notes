import { createRoot } from 'react-dom/client';
import { Documents } from 'react-documents/dist/src/client';
import Renderer from './Renderer';

createRoot(document.getElementById('root')!).render(<Documents title='Matek' Renderer={Renderer} padding/>);