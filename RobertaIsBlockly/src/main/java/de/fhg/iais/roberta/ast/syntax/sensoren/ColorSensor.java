package de.fhg.iais.roberta.ast.syntax.sensoren;

import java.util.Locale;

import de.fhg.iais.roberta.ast.syntax.Phrase;
import de.fhg.iais.roberta.dbc.Assert;
import de.fhg.iais.roberta.dbc.DbcException;

public class ColorSensor extends Sensor {
    private final Mode mode;
    private final SensorPort port;

    private ColorSensor(Mode mode, SensorPort port) {
        super(Phrase.Kind.ColorSensor);
        Assert.isTrue(mode != null);
        this.mode = mode;
        this.port = port;
        setReadOnly();
    }

    public static ColorSensor make(Mode mode, SensorPort port) {
        return new ColorSensor(mode, port);
    }

    public Mode getMode() {
        return this.mode;
    }

    public SensorPort getPort() {
        return this.port;
    }

    @Override
    public void toStringBuilder(StringBuilder sb, int indentation) {
        sb.append("(" + this.mode + ", " + this.port + ")");
    }

    @Override
    public String toString() {
        return "ColorSensor [mode=" + this.mode + ", port=" + this.port + "]";
    }

    public static enum Mode {
        COLOUR(), LIGHT(), AMBIENTLIGHT(), GET_MODE(), GET_SAMPLE();

        private final String[] values;

        private Mode(String... values) {
            this.values = values;
        }

        public static Mode get(String s) {
            if ( s == null || s.isEmpty() ) {
                throw new DbcException("Invalid binary operator symbol: " + s);
            }
            String sUpper = s.trim().toUpperCase(Locale.GERMAN);
            for ( Mode mo : Mode.values() ) {
                if ( mo.toString().equals(sUpper) ) {
                    return mo;
                }
                for ( String value : mo.values ) {
                    if ( sUpper.equals(value) ) {
                        return mo;
                    }
                }
            }
            throw new DbcException("Invalid binary operator symbol: " + s);
        }
    }
}
