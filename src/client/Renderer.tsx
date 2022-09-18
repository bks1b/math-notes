import { useState } from 'react';
import { Parser, Elements, Args, Bools, ParserElement, AsciiMath, TextOptions } from 'react-documents/dist/src/parser';
import { isMobile } from 'react-documents/dist/src/client/util';
import { Grapher2 } from 'grapher/dist/two/grapher';
import { Scene } from 'grapher/dist/two/visualizer';
import { Grapher3 } from 'grapher/dist/three';
import _complex from 'grapher/dist/complex';
import { Coord } from 'grapher/src/types';

_complex; // this line prevents webpack from excluding the import from the bundle, since it's used in eval

const GRAPH_SIZE = { width: 700, height: 500 };

const textOptions: TextOptions = {
    groupingChars: ['{', '}'],
    extended: (x: string) => {
        const math = x.match(/^@(.+?)@/);
        if (math) return [<AsciiMath inline text={math[1]}/>, math[0].length];
        if (x.startsWith('QEDbox')) return ['■', 6];
    },
};

const Frame = ({ text, name, bools }: { text: string[]; name: string; bools: Bools; }) => {
    const [shown, setShown] = useState([]);
    const sections = splitSections(text);
    return <div className='frameContainer'>
        <div className='frame'>
            <div className='h2'>{name || (bools.thm ? 'Tétel' : bools.def ? 'Definíció' : 'Feladat')}</div>
            <ExtendedParser text={sections[0][0].join('\n')}/>
            {
                sections
                    .slice(1)
                    .map((x, i) => <div key={i} className='frameSection'>
                        <button onClick={() => {
                            shown[i] = !shown[i];
                            setShown([...shown]);
                        }}>{x[1] === 'der' ? 'Levezetés' : x[1] === 'src' ? 'Forrás' : bools.thm ? 'Bizonyítás' : 'Megoldás'} {shown[i] ? 'elrejtése' : 'megjelenítése'}</button>
                        {shown[i] ? <ExtendedParser text={x[0].join('\n')}/> : ''}
                    </div>)
            }
        </div>
    </div>;
};

const baseGraph = (fn: (e: HTMLElement, x: string[], args: Args) => any, preventMobile = true) => ({
    render: (x, args) => <div className='graphContainer'>
        <div className='graph'>{
            preventMobile && isMobile
                ? 'Az interaktív ábrák mobilon el vannak rejtve.'
                : <div ref={el => {
                    if (!el) return;
                    el.innerHTML = '';
                    try {
                        fn(el, x, args);
                    } catch (e) {
                        el.innerHTML = e + '';
                        console.error(e);
                    }
                }}/>
        }</div>
    </div>,
}) as ParserElement;
const getGraphs = (a: string[], key: string) => eval(`with(${key}_1){const complex=complex_1.default;${a.join('\n')}}`);

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

const ExtendedParser = (props: { text: string; elements?: Elements; }) => <Parser text={props.text} textOptions={textOptions} fallbacks={[['text'], ['math']]} elements={{
    graph: baseGraph((el, x) => {
        const sections = splitSections(x);
        if (sections.length > 2) throw '2 sections expected at most.';
        const scene = new Scene(el);
        if (sections.length === 2) scene.createSliders(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (...args) => eval(`with(visualizer_1){${sections[1][0].join(';')}}`),
            sections[0][0].map(x => {
                const [, label, val, a, b, step] = x.match(/^(.+?)@([\d.]+)=\[([\d.]+),([\d.]+)\]:([\d.]+)$/) || [];
                if (!label) throw 'Invalid slider syntax.';
                return { label, val: +val, range: [+a, +b], step: +step };
            }),
        );
        else eval(`with(visualizer_1){${sections[0][0].join(';')}}`);
    }, false),
    graph2: baseGraph((e, x) => new Grapher2(e, getGraphs(x, 'grapher'), GRAPH_SIZE)),
    graph3: baseGraph((e, x, a) => {
        const sections = splitSections(x);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const grapher = new Grapher3(e, getGraphs(sections[0][0], 'three'), {}, { xRange: a.x.split(',').map(x => +x) as Coord, yRange: a.y.split(',').map(x => +x) as Coord }, GRAPH_SIZE);
        if (sections[1]) eval(sections[1][0].join(';'));
    }),
    ...props.elements || {},
}}/>;

export default (props: { text: string; name: string; }) => <>
    <div style={{ justifyContent: 'center', textAlign: 'center' }} className='h1'>{props.name}</div>
    <ExtendedParser text={props.text} elements={{
        frame: { render: (x, args, bools) => <Frame text={x} name={args.name} bools={bools}/>, closingTag: true },
    }}/>
</>;