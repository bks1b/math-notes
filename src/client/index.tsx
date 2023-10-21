import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Documents } from 'react-documents/dist/src/client';
import { Parser, Elements, AsciiMath, TextOptions } from 'react-documents/dist/src/parser';

const textOptions: TextOptions = {
    groupingChars: ['{', '}'],
    extended: (x: string) => {
        const math = x.match(/^@(.+?)@/);
        if (math) return [<AsciiMath inline text={math[1]}/>, math[0].length];
        if (x.startsWith('QEDbox')) return ['■', 6];
    },
};

const splitSections = (lines: string[]) => {
    const idx = lines.map((x, i) => [x, i, x.match(/^@(\w*)$/)] as const).filter(x => x[2]).map(x => [x[1], x[2][1]] as const);
    return (idx.length
        ? [
            [lines.slice(0, idx[0][0]), ''],
            ...idx.slice(1).map((x, i) => [lines.slice(idx[i][0] + 1, x[0]), idx[i][1]]),
            [lines.slice(idx.slice(-1)[0][0] + 1), idx.slice(-1)[0][1]],
        ]
        : [[lines, '']]) as [string[], string][];
};

const Frame = ({ text, name }: { text: string[]; name: string; }) => {
    const [shown, setShown] = useState([]);
    const sections = splitSections(text);
    const isExercise = window.location.pathname.split('/')[1] === 'Feladatok';
    return <div className='frameContainer'>
        <div className='frame'>
            <div className='h2'>{name || (isExercise ? 'Feladat' : 'Tétel')}</div>
            <ExtendedParser text={sections[0][0].join('\n')}/>
            {
                sections
                    .slice(1)
                    .map((x, i) => <div key={i} className='frameSection'>
                        <button onClick={() => {
                            shown[i] = !shown[i];
                            setShown([...shown]);
                        }}>{x[1] === 'der' ? 'Levezetés' : x[1] === 'src' ? 'Forrás' : isExercise ? 'Megoldás' : 'Bizonyítás'} {shown[i] ? 'elrejtése' : 'megjelenítése'}</button>
                        {shown[i] ? <ExtendedParser text={x[0].join('\n')}/> : ''}
                    </div>)
            }
        </div>
    </div>;
};

const ExtendedParser = (props: { text: string; elements?: Elements; }) => <Parser text={props.text} textOptions={textOptions} fallbacks={[['text'], ['math']]} elements={{
    img: { render: x => <img src={x[0]} className='image'/> },
    ...props.elements || {},
}}/>;

const Renderer = (props: { text: string; name: string; }) => <>
    <div style={{ justifyContent: 'center', textAlign: 'center' }} className='h1'>{props.name}</div>
    <ExtendedParser text={props.text} elements={{
        frame: { render: (x, args) => <Frame text={x} name={args.name}/>, closingTag: true },
    }}/>
</>;

const root = document.getElementById('root')!;

createRoot(root).render(<Documents title='Matek' Renderer={Renderer} rootElement={root} padding/>);