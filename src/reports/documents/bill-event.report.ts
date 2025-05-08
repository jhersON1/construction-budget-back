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
    margin: [0, 10, 0, 5],
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
  sectionHeader: {
    bold: true,
    fontSize: 14,
    color: '#2c5282',
    margin: [0, 15, 0, 5],
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
  datosGenerales: {
    margin: [0, 5, 0, 15],
  }
};

export const billEventReport = (data: any): TDocumentDefinitions => {
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

    // Agregar un divisor entre presupuestos (excepto para el primero)
    if (index > 0) {
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

    // Agregar título del presupuesto
    content.push({
      text: presupuesto.tipo,
      style: 'h2',
      margin: [0, 0, 0, 10],
    });

    // Agregar datos generales si existen
    if (presupuesto.datos_generales) {
      content.push({
        text: 'Datos Generales',
        style: 'sectionHeader',
      });

      const datosGeneralesArray = [
        ['Tipo de evento:', presupuesto.datos_generales.tipo_evento || ''],
        ['Ubicación:', presupuesto.datos_generales.ubicacion || ''],
        ['Fecha estimada:', presupuesto.datos_generales.fecha || ''],
        ['Número de invitados:', presupuesto.datos_generales.invitados ? presupuesto.datos_generales.invitados.toString() : ''],
        ['Modalidad:', presupuesto.datos_generales.modalidad || ''],
        ['Presupuesto máximo:', presupuesto.datos_generales.presupuesto_maximo || '']
      ];

      content.push({
        table: {
          widths: ['30%', '70%'],
          body: datosGeneralesArray
        },
        layout: 'noBorders',
        style: 'datosGenerales'
      });
    }

    // Procesar cada categoría de gastos
    if (presupuesto.categorias && Array.isArray(presupuesto.categorias)) {
      presupuesto.categorias.forEach((categoria: any) => {
        // Título de la categoría
        content.push({
          text: categoria.nombre,
          style: 'sectionHeader',
        });

        // Tabla de partidas de la categoría
        const tableCategoriaRows = [
          [
            { text: 'Material', style: 'tableHeader' },
            { text: 'Cantidad', style: 'tableHeader' },
            { text: 'Precio Unit. (' + moneda + ')', style: 'tableHeader' },
            { text: 'Proveedor', style: 'tableHeader' },
            { text: 'Subtotal (' + moneda + ')', style: 'tableHeader' },
          ],
        ];

        // Agregar filas por cada partida
        categoria.partidas.forEach((partida: any) => {
          tableCategoriaRows.push([
            partida.material,
            partida.cantidad.toString(),
            partida.precio_unitario.toString(),
            partida.proveedor,
            partida.subtotal.toString(),
          ]);
        });

        content.push({
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: tableCategoriaRows,
          },
          layout: 'lightHorizontalLines',
          style: 'table',
        });
      });
    }

    // Sección de totales
    content.push({
      text: 'Resumen General',
      style: 'h2',
      margin: [0, 10, 0, 5],
    });

    // Crear tabla de resumen
    const tablaTotales: Array<Array<{text: string, style?: string}>> = [];
    
    // Agregar subtotales por categoría si existen
    if (presupuesto.categorias && Array.isArray(presupuesto.categorias)) {
      presupuesto.categorias.forEach((categoria: any) => {
        tablaTotales.push([
          { text: categoria.nombre + ":" },
          { text: categoria.subtotal_categoria + " " + moneda }
        ]);
      });
    }
    
    // Agregar línea de subtotal
    tablaTotales.push([
      { text: 'Subtotal:', style: 'total' },
      { text: presupuesto.totales.subtotal + ' ' + moneda, style: 'total' }
    ]);
    
    // Agregar honorarios si existen
    if (presupuesto.totales.honorarios) {
      tablaTotales.push([
        { text: 'Honorarios organización:', style: 'total' },
        { text: presupuesto.totales.honorarios + ' ' + moneda, style: 'total' }
      ]);
    }
    
    // Agregar costo total
    tablaTotales.push([
      { text: 'COSTO TOTAL ESTIMADO:', style: 'total' },
      { text: presupuesto.totales.costo_total_estimado + ' ' + moneda, style: 'total' }
    ]);

    content.push({
      table: {
        headerRows: 0,
        widths: ['*', 'auto'],
        body: tablaTotales,
      },
      layout: 'lightHorizontalLines',
    });

    // Justificación técnica
    if (presupuesto.justificacion_tecnica) {
      content.push({
        text: 'Justificación Técnica',
        style: 'h2',
        margin: [0, 20, 0, 5],
      });
      content.push({
        text: presupuesto.justificacion_tecnica,
        style: 'justificacion',
      });
    }
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