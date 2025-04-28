import {
  Content,
  StyleDictionary,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';

const logo: Content = {
  image: 'src/assets/ficct_banner.png',
  width: 50,
  height: 80,
};

const styles: StyleDictionary = {
  h1: {
    fontSize: 24,
    bold: true,
    margin: [0, 5],
  },
  h2: {
    fontSize: 18,
    bold: true,
  },
  h3: {
    fontSize: 16,
    bold: true,
  },
  table: {
    margin: [0, 5, 0, 15],
  },
  tableHeader: {
    bold: true,
    fontSize: 13,
    color: 'black',
    fillColor: '#eeeeee',
  },
  total: {
    bold: true,
    fontSize: 14,
  },
  justificacion: {
    fontSize: 12,
    italics: true,
    margin: [0, 10, 0, 10],
  },
  presupuestoSection: {
    margin: [0, 0, 0, 20],
  },
  divider: {
    margin: [0, 15, 0, 15],
  },
};

export const billReport = (data: any): TDocumentDefinitions => {
  // Obtener la fecha actual
  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Contenido principal del documento
  const content: any[] = [
    {
      columns: [
        logo,
        {
          width: '*',
          text: 'Presupuesto by Sam',
          style: 'h1',
          margin: [10, 25, 0, 0],
        },
      ],
    },
    {
      text: 'Fecha: ' + formattedDate,
      alignment: 'right',
      margin: [0, 10, 0, 20],
    },
  ];

  // Procesar cada presupuesto
  data.presupuestos.forEach((presupuesto: any, index: number) => {
    // Establecer moneda por defecto si no existe
    const moneda = presupuesto.moneda || 'Bs';

    // Crear filas para la tabla de materiales
    const tableMaterialesRows = [
      [
        { text: 'Material', style: 'tableHeader' },
        { text: 'Cantidad', style: 'tableHeader' },
        {
          text: 'Precio Unit. (' + moneda + ')',
          style: 'tableHeader',
        },
        { text: 'Proveedor', style: 'tableHeader' },
        { text: 'Subtotal (' + moneda + ')', style: 'tableHeader' },
      ],
    ];

    // Agregar filas por cada material
    presupuesto.partidas.forEach((partida: any) => {
      tableMaterialesRows.push([
        partida.material,
        partida.cantidad !== null ? partida.cantidad.toString() : '-',
        partida.precio_unitario !== null
          ? partida.precio_unitario.toString()
          : '-',
        partida.proveedor,
        partida.subtotal.toString(),
      ]);
    });

    // Agregar fila de total de materiales
    tableMaterialesRows.push([
      { text: 'Total Materiales', colSpan: 4 } as any,
      '',
      '',
      '',
      {
        text: presupuesto.totales.materiales + ' ' + moneda,
        style: 'total',
      },
    ]);

    // Agregar un divisor entre presupuestos (excepto para el primero)
    if (index > 0) {
      // En lugar de usar canvas en el estilo, lo definimos directamente como contenido
      content.push({
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 1,
            lineColor: '#999999',
          },
        ],
        style: 'divider',
      });
    }

    // Agregar la sección del presupuesto actual
    const presupuestoContent = [
      {
        text: 'Presupuesto ' + (index + 1) + ': ' + presupuesto.tipo,
        style: 'h2',
        margin: [0, 0, 0, 10],
      },
      // Tabla de Materiales
      {
        text: 'Detalle de Materiales',
        style: 'h2',
        margin: [0, 10, 0, 5],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: tableMaterialesRows,
        },
        layout: 'lightHorizontalLines',
      },
      // Sección de totales
      {
        text: 'Resumen de Costos',
        style: 'h2',
        margin: [0, 10, 0, 5],
      },
      {
        table: {
          headerRows: 0,
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Total Materiales:', style: 'total' },
              {
                text: presupuesto.totales.materiales + ' ' + moneda,
                style: 'total',
              },
            ],
            [
              { text: 'Mano de Obra:', style: 'total' },
              {
                text: presupuesto.totales.mano_de_obra + ' ' + moneda,
                style: 'total',
              },
            ],
            [
              { text: 'Extras:', style: 'total' },
              {
                text: presupuesto.totales.extras + ' ' + moneda,
                style: 'total',
              },
            ],
            [
              { text: 'COSTO TOTAL ESTIMADO:', style: 'total' },
              {
                text: presupuesto.totales.costo_total_estimado + ' ' + moneda,
                style: 'total',
              },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },
      // Justificación técnica
      {
        text: 'Justificación Técnica',
        style: 'h2',
        margin: [0, 20, 0, 5],
      },
      {
        text: presupuesto.justificacion_tecnica,
        style: 'justificacion',
      },
    ];

    // Agregar la sección completa del presupuesto al contenido principal
    content.push({
      stack: presupuestoContent,
      style: 'presupuestoSection',
    });
  });

  return {
    header: {
      text: 'FICCT-UAGRM',
      alignment: 'right',
      margin: [5, 5],
    },
    content: content,
    styles: styles,
  };
};
