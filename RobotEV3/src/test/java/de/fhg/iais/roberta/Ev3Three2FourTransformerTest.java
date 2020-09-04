package de.fhg.iais.roberta;

import org.junit.BeforeClass;
import org.junit.Test;

import java.util.Collections;

import de.fhg.iais.roberta.components.Project;
import de.fhg.iais.roberta.factory.IRobotFactory;
import de.fhg.iais.roberta.util.Util;
import de.fhg.iais.roberta.util.test.UnitTestHelper;
import de.fhg.iais.roberta.worker.transform.Ev3Three2FourTransformerWorker;

public class Ev3Three2FourTransformerTest {
    private static IRobotFactory testFactory;

    private static final String OLD_CONFIGURATION_XML =
        "<block_set xmlns=\"http://de.fhg.iais.roberta.blockly\" tags=\"\" description=\"\" xmlversion=\"2.0\" robottype=\"ev3\">"
        + "  <instance y=\"213\" x=\"213\">"
        + "    <block deletable=\"false\" intask=\"true\" id=\"1\" type=\"robBrick_EV3-Brick\">"
        + "      <field name=\"WHEEL_DIAMETER\">5.6</field>"
        + "      <field name=\"TRACK_WIDTH\">18</field>"
        + "      <value name=\"S1\">"
        + "        <block intask=\"true\" id=\"2\" type=\"robBrick_touch\"/>"
        + "      </value>"
        + "      <value name=\"S2\">"
        + "        <block intask=\"true\" id=\"3\" type=\"robBrick_gyro\"/>"
        + "      </value>"
        + "      <value name=\"S3\">"
        + "        <block intask=\"true\" id=\"4\" type=\"robBrick_colour\"/>"
        + "      </value>"
        + "      <value name=\"S4\">"
        + "        <block intask=\"true\" id=\"5\" type=\"robBrick_ultrasonic\"/>"
        + "      </value>"
        + "      <value name=\"MB\">"
        + "        <block intask=\"true\" id=\"6\" type=\"robBrick_motor_big\">"
        + "          <field name=\"MOTOR_REGULATION\">TRUE</field>"
        + "          <field name=\"MOTOR_REVERSE\">OFF</field>"
        + "          <field name=\"MOTOR_DRIVE\">RIGHT</field>"
        + "        </block>"
        + "      </value>"
        + "      <value name=\"MC\">"
        + "        <block intask=\"true\" id=\"7\" type=\"robBrick_motor_big\">"
        + "          <field name=\"MOTOR_REGULATION\">TRUE</field>"
        + "          <field name=\"MOTOR_REVERSE\">OFF</field>"
        + "          <field name=\"MOTOR_DRIVE\">LEFT</field>"
        + "        </block>"
        + "      </value>"
        + "    </block>"
        + "  </instance>"
        + "</block_set>";

    @BeforeClass
    public static void setupBefore() throws Exception {
        testFactory = Util.configureRobotPlugin("ev3lejosv1", "", "", Collections.emptyList());
    }

    @Test
    public void executeTransformer_ShouldReturnTransformedCompass_WhenGivenOldCompass() {
        String expectedProgramAst =
            "BlockAST[project=[[Location[x=549,y=76],MainTask[],"
            + "DebugAction[SensorExpr[CompassSensor[C,ANGLE,EMPTY_SLOT]]],"
            + "DebugAction[SensorExpr[GetSampleSensor[CompassSensor[C,ANGLE,EMPTY_SLOT]]]]]]]";
        String[] expectedToBeInConfigAst =
            {
                "ConfigurationComponent[componentType=COMPASS,isActor=true,userDefinedName=C,portName=C,componentProperties={}]"
            };

        Project project =
            UnitTestHelper.setupWithConfigAndProgramXML(testFactory, Util.readResourceContent("/transform/old_compass.xml"), OLD_CONFIGURATION_XML).build();

        new Ev3Three2FourTransformerWorker().execute(project);
        UnitTestHelper.checkAstEquality(project.getProgramAst().getTree().toString(), expectedProgramAst);
        UnitTestHelper.checkAstContains(project.getConfigurationAst().getConfigurationComponentsValues().toString(), expectedToBeInConfigAst);
    }
}
